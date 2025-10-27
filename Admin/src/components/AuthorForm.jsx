import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AuthorForm = ({ author, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '',
    website: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: ''
    }
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});

  const { token } = useAuth();

  useEffect(() => {
    if (author) {
      setFormData({
        name: author.name || '',
        bio: author.bio || '',
        email: author.email || '',
        website: author.website || '',
        socialMedia: author.socialMedia || {
          instagram: '',
          facebook: '',
          twitter: ''
        }
      });
      setImagePreview(author.profileImage || '');
    }
  }, [author]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [name]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Author name is required';
    if (!formData.bio.trim()) newErrors.bio = 'Bio is required';
    if (!imageFile && !author) newErrors.image = 'Profile image is required';

    // Validate email format if provided
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate website URL format if provided
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = new FormData();
    
    // Append basic fields
    submitData.append('name', formData.name);
    submitData.append('bio', formData.bio);
    submitData.append('email', formData.email);
    submitData.append('website', formData.website);
    submitData.append('socialMedia', JSON.stringify(formData.socialMedia));

    // Append image if file is selected
    if (imageFile) {
      submitData.append('profileImage', imageFile);
    }

    await onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="!space-y-6 max-h-96 overflow-y-auto !p-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 !mb-2">
          Profile Image {!author && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center !space-x-6">
          <div className="flex-shrink-0">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="h-32 w-32 object-cover rounded-lg border border-gray-300"
              />
            ) : (
              <div className="h-32 w-32 bg-gray-200 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No image</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:!mr-4 file:!py-2 file:!px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: Square image, 400x400px, max 5MB
            </p>
            {errors.image && (
              <p className="text-red-500 text-xs !mt-1">{errors.image}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Basic Information */}
        <div className="!space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Author Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter author name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs !mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleInputChange}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.bio ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter author biography"
            />
            {errors.bio && (
              <p className="text-red-500 text-xs !mt-1">{errors.bio}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="author@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs !mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.website ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="text-red-500 text-xs !mt-1">{errors.website}</p>
              )}
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="!space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Social Media</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Instagram
              </label>
              <input
                type="text"
                name="instagram"
                value={formData.socialMedia.instagram}
                onChange={handleSocialMediaChange}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Facebook
              </label>
              <input
                type="text"
                name="facebook"
                value={formData.socialMedia.facebook}
                onChange={handleSocialMediaChange}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Twitter
              </label>
              <input
                type="text"
                name="twitter"
                value={formData.socialMedia.twitter}
                onChange={handleSocialMediaChange}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="username"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end !space-x-3 !pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="!px-6 !py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 cursor-pointer"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white !px-6 !py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center cursor-pointer"
        >
          {loading && <LoadingSpinner size="small" className="!mr-2" />}
          {author ? 'Update Author' : 'Create Author'}
        </button>
      </div>
    </form>
  );
};

export default AuthorForm;