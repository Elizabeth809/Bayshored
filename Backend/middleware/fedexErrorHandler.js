export const fedexErrorHandler = (err, req, res, next) => {
  if (err.message?.includes('FedEx API Error')) {
    console.error('FedEx API Error:', err.message);
    
    // Parse FedEx error response
    let fedexError;
    try {
      fedexError = JSON.parse(err.message.replace('FedEx API Error: ', ''));
    } catch {
      fedexError = { message: err.message };
    }
    
    return res.status(400).json({
      success: false,
      message: 'FedEx API Error',
      error: fedexError,
      code: 'FEDEX_API_ERROR'
    });
  }
  
  next(err);
};