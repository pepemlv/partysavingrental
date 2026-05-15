import { MapPin, User, Phone, Mail, CheckCircle2, Calendar } from 'lucide-react';
import { useState } from 'react';
import { GeocodedAddress } from '../utils/distance';

interface EventDetailsFormProps {
  eventAddress: string;
  eventState: string;
  eventZipcode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventDate: string;
  onEventAddressChange: (address: string) => void;
  onEventStateChange: (state: string) => void;
  onEventZipcodeChange: (zipcode: string) => void;
  onCustomerNameChange: (name: string) => void;
  onCustomerPhoneChange: (phone: string) => void;
  onCustomerEmailChange: (email: string) => void;
  onEventDateChange: (date: string) => void;
  onValidateAddress: () => void;
  isAddressValid: boolean;
  validatedAddress: GeocodedAddress | null;
  rentalDays: number;
  distanceMiles: number;
  deliveryFee: number;
  collectionFee: number;
  deliveryMethod: 'pickup' | 'delivery';
  selectedCityName: string;
  advanceDays: number;
  subtotal: number;
}

export default function EventDetailsForm({
  eventAddress,
  eventState,
  eventZipcode,
  customerName,
  customerPhone,
  customerEmail,
  eventDate,
  onEventAddressChange,
  onEventStateChange,
  onEventZipcodeChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCustomerEmailChange,
  onEventDateChange,
  onValidateAddress,
  isAddressValid,
  validatedAddress,
  rentalDays,
  distanceMiles,
  deliveryFee,
  collectionFee,
  deliveryMethod,
  selectedCityName,
  advanceDays,
  subtotal,
}: EventDetailsFormProps) {
  const [showValidation, setShowValidation] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Calculate minimum date based on advance days
  const getMinDate = () => {
    const today = new Date();
    // advanceDays includes today, so we subtract 1 to get the correct earliest date
    // e.g., 5 days in advance from Dec 22 means earliest date is Dec 26 (22+4)
    today.setDate(today.getDate() + Math.max(0, advanceDays - 1));
    return today.toISOString().split('T')[0];
  };

  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    if (digitsOnly.length !== 10) {
      setPhoneError('Phone number must be 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateEmail = (email: string): boolean => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleValidate = async () => {
    // Validate phone and email
    const isPhoneValid = validatePhone(customerPhone);
    const isEmailValid = validateEmail(customerEmail);

    if (!isPhoneValid || !isEmailValid) {
      return; // Don't proceed if validation fails
    }

    setIsValidating(true);
    setShowValidation(false);
    
    // Wait at least 5 seconds to show validation progress
    const minDelay = new Promise(resolve => setTimeout(resolve, 5000));
    const validationPromise = Promise.resolve(onValidateAddress());
    
    // Wait for both the minimum delay and validation to complete
    await Promise.all([minDelay, validationPromise]);
    
    setIsValidating(false);
    setShowValidation(true);
  };

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDeliverySchedule = (eventDateStr: string) => {
    if (!eventDateStr) return null;

    const eventDate = new Date(eventDateStr + 'T00:00:00');
    const returnDate = new Date(eventDate);
    returnDate.setDate(returnDate.getDate() + rentalDays);

    return {
      deliveryDate: eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }),
      pickupDate: returnDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }),
    };
  };

  const schedule = getDeliverySchedule(eventDate);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Details</h3>

      <div className="space-y-5">
        

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4" />
            Select Event Date
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => onEventDateChange(e.target.value)}
            min={getMinDate()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
          />
          {advanceDays > 0 && (
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ {selectedCityName} requires payment at least {advanceDays} days in advance to confirm your reservation and delivery. Earliest available date: {new Date(getMinDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          {eventDate && (
            <div className="mt-2 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Your event is scheduled for <span className="font-semibold">{formatEventDate(eventDate)}</span>
              </p>
            </div>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4" />
            Person of Contact
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Full name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => {
              onCustomerPhoneChange(e.target.value);
              setPhoneError(''); // Clear error on change
            }}
            onBlur={() => validatePhone(customerPhone)}
            placeholder="980 123 4567"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
              phoneError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {phoneError && (
            <p className="text-sm text-red-600 mt-1">{phoneError}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4" />
            Email for Receipt
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => {
              onCustomerEmailChange(e.target.value);
              setEmailError(''); // Clear error on change
            }}
            onBlur={() => validateEmail(customerEmail)}
            placeholder="your@email.com"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
              emailError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {emailError && (
            <p className="text-sm text-red-600 mt-1">{emailError}</p>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4" />
            Event Address
          </label>
          <div className="space-y-3">
            <input
              type="text"
              value={eventAddress}
              onChange={(e) => {
                onEventAddressChange(e.target.value);
                setShowValidation(false);
              }}
              placeholder="Street address (e.g., 7119 Haines Mill)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={eventState}
                onChange={(e) => {
                  onEventStateChange(e.target.value);
                  setShowValidation(false);
                }}
                placeholder="State (e.g., TX)"
                maxLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 uppercase"
              />
              <input
                type="text"
                value={eventZipcode}
                onChange={(e) => {
                  onEventZipcodeChange(e.target.value);
                  setShowValidation(false);
                }}
                placeholder="Zipcode (e.g., 75126)"
                maxLength={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
          {/* Validation errors */}
          {(!eventDate || eventDate < getMinDate()) && (
            <p className="text-sm text-red-600 mt-2 font-semibold">⚠️ Please select a valid event date (at least {advanceDays} days in advance)</p>
          )}
          {subtotal === 0 && (
            <p className="text-sm text-red-600 mt-2 font-semibold">⚠️ Please select at least one item</p>
          )}
          <button
            onClick={handleValidate}
            disabled={!eventAddress || !eventState || !eventZipcode || isValidating || !eventDate || eventDate < getMinDate() || subtotal === 0}
            className="w-full mt-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm"
          >
            {isValidating ? 'Validating...' : 'Validate Address'}
          </button>

          {isValidating && (
            <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-800 font-medium">Checking your address...</p>
              </div>
            </div>
          )}

          {showValidation && isAddressValid && validatedAddress && (
            <div className="mt-2 space-y-2">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800 font-semibold">Address validated successfully</p>
                </div>
                
                <div className="ml-7 space-y-2 mb-3">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800 mb-1">Validated Address:</p>
                   
                  </div>
                  {validatedAddress.display_name && (
                    <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-green-100">
                     
                      <p className="leading-relaxed">
                        {validatedAddress.address.house_number && `${validatedAddress.address.house_number} `}
                        {validatedAddress.address.road && `${validatedAddress.address.road}, `}
                        {validatedAddress.address.city && `${validatedAddress.address.city}, `}
                        {validatedAddress.address.state && `${validatedAddress.address.state} `}
                        {validatedAddress.address.postcode}
                      </p>
                    </div>
                  )}
                </div>

                <div className="ml-7 space-y-1 pt-2 border-t border-green-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Distance:</span> {distanceMiles.toFixed(2)} miles
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Delivery Fee:</span> ${deliveryFee.toFixed(2) }
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Collection Fee:</span> ${collectionFee.toFixed(2)}
                  </p>
                  
                  {distanceMiles > 25 && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ This delivery is over 25 miles. Please check if you chose the right city close to your address.
                      </p>
                      {deliveryMethod === 'pickup' && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            💡 You selected <span className="font-semibold">Pickup Yourself</span> - You'll pick up and return equipment at our location.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showValidation && !isAddressValid && eventAddress && (
            <div className="mt-2 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-medium mb-2">Unable to validate address. Please check and try again or use Self pickup method to pickup equipment with your car.</p>
            </div>
          )}
        </div>

        {eventDate && schedule && (
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Rental Duration: {rentalDays} day{rentalDays !== 1 ? 's' : ''}</p>
             
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">• Delivery Same day:</span> {schedule.deliveryDate} between 8:00 AM - 10:00 AM
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">• Return Equipment:</span> {schedule.pickupDate} between 8:00 AM - 10:00 AM
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
