import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Plus, Minus, Truck, RotateCcw, Shield } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Review } from '../types/review';

interface ReviewFormData {
  rating: number;
  comment: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const { getProductById } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const product = getProductById(id || '');

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch reviews
  useEffect(() => {
    if (id) {
      fetchReviews();
    }
  }, [id]);

  const fetchReviews = async () => {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('productId', '==', id),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Review[];
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setErrorMsg('Failed to load reviews');
      setShowToast(true);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    setSubmittingReview(true);
    try {
      // Add review to Firestore
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        createdAt: new Date(),
        status: 'pending'
      });

      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      setErrorMsg('Review submitted for approval!');
      setShowToast(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrorMsg('Failed to submit review');
      setShowToast(true);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      setErrorMsg('Review deleted successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error deleting review:', error);
      setErrorMsg('Failed to delete review');
      setShowToast(true);
    }
  };
  // Removed unused variables: redirectCheckout, productDetail, navigate

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Product not found</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product.inStock) {
      setErrorMsg('This product is out of stock');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }
    if (!selectedSize || !selectedColor) {
      setErrorMsg('Please select size and color');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
      shippingCharges: product.shippingCharges ?? 0,
      quantity: quantity
    });
    setErrorMsg('Product added to cart!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product.inStock) {
      setErrorMsg('This product is out of stock');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }
    if (!selectedSize || !selectedColor) {
      setErrorMsg('Please select size and color');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
      shippingCharges: product.shippingCharges ?? 0,
      quantity: quantity
    });
    setLoadingBuy(true);
    setTimeout(() => {
      setLoadingBuy(false);
      navigate('/checkout');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-yellow-600">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-yellow-600">Products</Link>
            <span>/</span>
            <Link to={`/products/${product.category}`} className="hover:text-yellow-600 capitalize">
              {product.category.replace('-', ' ')}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-white shadow-lg">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-yellow-500' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-gray-600 ml-2">({product.reviews} reviews)</span>
                </div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">₹{product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Size</h3>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-2 sm:px-4 border rounded-lg font-medium transition-colors text-sm sm:text-base ${
                      selectedSize === size
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-500'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Color</h3>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-2 sm:px-4 border rounded-lg font-medium transition-colors text-sm sm:text-base ${
                      selectedColor === color
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-500'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 sm:p-3 hover:bg-gray-100 rounded-l-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 sm:py-3 font-medium min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 sm:p-3 hover:bg-gray-100 rounded-r-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {product.inStock ? (
                  <span className="text-green-600 font-medium">In Stock</span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`flex-1 px-4 py-3 sm:px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg ${
                  !product.inStock 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white hover:shadow-xl'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                className={`flex-1 px-4 py-3 sm:px-6 rounded-lg font-semibold transition-colors relative shadow-lg ${
                  !product.inStock || loadingBuy
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-xl'
                }`}
                disabled={!product.inStock || loadingBuy}
              >
                {loadingBuy ? (
                  <span className="flex items-center justify-center w-full">
                    <span className="loader-bar bg-yellow-500 h-2 w-full absolute left-0 top-0 animate-pulse" style={{ borderRadius: '4px' }}></span>
                    <span className="ml-2">Processing...</span>
                  </span>
                ) : (
                  'Buy Now'
                )}
              </button>
              <button 
                onClick={async () => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  try {
                    await addDoc(collection(db, 'wishlists'), {
                      userId: user.uid,
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.images[0],
                      addedAt: new Date()
                    });
                    setErrorMsg('Added to wishlist!');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                  } catch (error) {
                    console.error('Error adding to wishlist:', error);
                    setErrorMsg('Failed to add to wishlist');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                  }
                }}
                className="sm:w-auto w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md">
                <Heart className="w-5 h-5 text-gray-600" />
              </button>
            </div>
      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowReviewModal(false)}></div>
            
            <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Write a Review</h3>
              </div>
              
              <form onSubmit={handleSubmitReview} className="p-6">
                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast pop-up for Add to Cart and errors */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-8 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-base sm:text-lg font-semibold animate-fadeIn max-w-sm sm:max-w-none mx-auto">
          {errorMsg}
        </div>
      )}

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Free Shipping</span>
                </div>
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Easy Returns</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600">Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Reviews</h2>
              {user && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Review</span>
                </button>
              )}
            </div>
            
            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{review.userName}</span>
                        <div className="flex items-center space-x-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-500 text-sm mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {user?.uid === review.userId && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4">{review.comment}</p>
                  {review.media && review.media.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {review.media.map((item, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                          {item.type === 'image' ? (
                            <img
                              src={item.url}
                              alt={`Review ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={item.url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{product.category.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Sizes:</span>
                    <span className="font-medium">{product.sizes.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Colors:</span>
                    <span className="font-medium">{product.colors.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">{product.rating}/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;