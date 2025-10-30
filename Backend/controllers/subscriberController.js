import Subscriber from '../models/subscriberModel.js';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Subscribe to newsletter
// @route   POST /api/v1/subscribe
// @access  Public
export const subscribe = async (req, res) => {
  try {
    const { name, email, source = 'website' } = req.body;

    // Check if already subscribed
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({
          success: false,
          message: 'You are already subscribed to our newsletter'
        });
      } else {
        // Reactivate existing subscriber
        existingSubscriber.isActive = true;
        existingSubscriber.name = name;
        existingSubscriber.source = source;
        await existingSubscriber.save();

        await sendWelcomeEmail(email, name);

        return res.json({
          success: true,
          message: 'Welcome back! You have been resubscribed to our newsletter'
        });
      }
    }

    // Create new subscriber
    const subscriber = await Subscriber.create({
      name,
      email,
      source
    });

    // Send welcome email
    await sendWelcomeEmail(email, name);

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to our newsletter!',
      data: subscriber
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while subscribing',
      error: error.message
    });
  }
};

// @desc    Unsubscribe from newsletter
// @route   POST /api/v1/unsubscribe
// @access  Public
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our subscription list'
      });
    }

    if (!subscriber.isActive) {
      return res.status(400).json({
        success: false,
        message: 'You are already unsubscribed'
      });
    }

    subscriber.isActive = false;
    await subscriber.save();

    res.json({
      success: true,
      message: 'You have been unsubscribed from our newsletter'
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unsubscribing',
      error: error.message
    });
  }
};

// @desc    Get all subscribers (Admin)
// @route   GET /api/v1/subscribers
// @access  Private/Admin
export const getSubscribers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'active',
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const subscribers = await Subscriber.find(filter)
      .sort({ subscribedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subscriber.countDocuments(filter);
    
    // Get subscription stats
    const stats = await Subscriber.aggregate([
      {
        $group: {
          _id: null,
          totalSubscribers: { $sum: 1 },
          activeSubscribers: { $sum: { $cond: ['$isActive', 1, 0] } },
          newThisMonth: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $gte: ['$subscribedAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                    { $eq: ['$isActive', true] } // <-- THE FIX IS HERE
                  ]
                }, 
                1, 
                0 
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      count: subscribers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      stats: stats[0] || { totalSubscribers: 0, activeSubscribers: 0, newThisMonth: 0 },
      data: subscribers
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscribers',
      error: error.message
    });
  }
};

// @desc    Get subscriber stats for dashboard
// @route   GET /api/v1/subscribers/stats
// @access  Private/Admin
export const getSubscriberStats = async (req, res) => {
  try {
    // Get monthly subscription data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Subscriber.aggregate([
      {
        $match: {
          subscribedAt: { $gte: sixMonthsAgo },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$subscribedAt' },
            month: { $month: '$subscribedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get source distribution
    const sourceDistribution = await Subscriber.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format monthly data
    const formattedMonthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthData = monthlyData.find(m => 
        m._id.year === year && m._id.month === month
      );
      
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        subscribers: monthData?.count || 0
      };
    }).reverse();

    res.json({
      success: true,
      data: {
        monthly: formattedMonthlyData,
        sources: sourceDistribution
      }
    });

  } catch (error) {
    console.error('Get subscriber stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscriber statistics',
      error: error.message
    });
  }
};

// @desc    Delete subscriber (Admin)
// @route   DELETE /api/v1/subscribers/:id
// @access  Private/Admin
export const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    await Subscriber.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Subscriber deleted successfully'
    });

  } catch (error) {
    console.error('Delete subscriber error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting subscriber',
      error: error.message
    });
  }
};

// Helper function to send welcome email
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to MERN Art Newsletter!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; text-align: center;">Welcome to MERN Art Gallery!</h2>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
        <h3 style="margin: 0; font-size: 24px;">Hello ${name}!</h3>
        <p style="margin: 15px 0 0 0; font-size: 16px;">
          Thank you for subscribing to our newsletter
        </p>
      </div>

      <div style="padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 20px 0;">
        <h4 style="color: #333; margin-top: 0;">What to expect:</h4>
        <ul style="color: #666; line-height: 1.6;">
          <li>🎨 Latest artwork collections and new arrivals</li>
          <li>👨‍🎨 Featured artists and their stories</li>
          <li>💫 Exclusive discounts and early access to sales</li>
          <li>📅 Art events and exhibition announcements</li>
          <li>🎁 Special offers for our subscribers</li>
        </ul>
      </div>

      <p style="color: #666; line-height: 1.6;">
        We're excited to share the world of art with you. Stay tuned for our next update!
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/store" 
           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Explore Our Gallery
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        You're receiving this email because you subscribed to our newsletter.<br>
        <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color: #667eea;">Unsubscribe</a> 
        if you no longer wish to receive these emails.
      </p>

      <p style="color: #999; font-size: 12px; text-align: center;">
        MERN ART GALLERY<br>
        123 Art Street, Creative District<br>
        Mumbai, Maharashtra 400001
      </p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};