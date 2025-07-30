import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, Lock, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Trash2,
} from 'lucide-react';

const API_BASE = 'https://apiotpv1.vercel.app'; // update your backend URL here

const OTPVerification = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showOtp, setShowOtp] = useState(true);
  const [allOtps, setAllOtps] = useState({});
  const [backendStatus, setBackendStatus] = useState('connecting'); // 'connected' | 'error' | 'connecting'
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(0);

  const resendTimerRef = useRef(null);
  const expiryTimerRef = useRef(null);

  // Check backend connection and fetch all OTPs
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE.replace('/api', '')}/`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch {
      setBackendStatus('error');
    }
  };

  const fetchAllOtps = async () => {
    try {
      const response = await fetch(`${API_BASE}/demo/all-otps`);
      const data = await response.json();
      setAllOtps(data);
      setBackendStatus('connected');
    } catch (error) {
      console.error('Failed to fetch OTPs:', error);
      setAllOtps({});
      setBackendStatus('error');
    }
  };

  useEffect(() => {
    checkBackendStatus();
    fetchAllOtps();
    const interval = setInterval(fetchAllOtps, 2000);
    return () => clearInterval(interval);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      resendTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(resendTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(resendTimerRef.current);
  }, [resendCooldown]);

  // OTP expiry countdown timer
  useEffect(() => {
    if (step === 'otp' && otpExpirySeconds > 0) {
      expiryTimerRef.current = setInterval(() => {
        setOtpExpirySeconds((prev) => {
          if (prev <= 1) {
            clearInterval(expiryTimerRef.current);
            setMessage('OTP expired. Please request a new one.');
            setMessageType('error');
            reset();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(expiryTimerRef.current);
  }, [step, otpExpirySeconds]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const sendOtp = async () => {
    if (!phoneNumber.trim()) {
      setMessage('Please enter a valid phone number');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedOtp(data.otp);
        setMessage(data.message);
        setMessageType('success');
        setStep('otp');
        setOtp('');
        setOtpExpirySeconds(300); // 5 min
        setResendCooldown(60);    // 60 sec cooldown
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage(data.detail || 'Failed to send OTP');
        setMessageType('error');
      }
    } catch {
      setMessage('Network error. Please check backend connection.');
      setMessageType('error');
    } finally {
      setLoading(false);
      fetchAllOtps();
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setMessage('Please enter the OTP');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, otp }),
      });

      const data = await response.json();

      setMessage(data.message);
      setMessageType(data.success ? 'success' : 'error');

      if (data.success) {
        setTimeout(() => reset(), 2000);
      }
    } catch {
      setMessage('Network error. Please check backend connection.');
      setMessageType('error');
    } finally {
      setLoading(false);
      fetchAllOtps();
    }
  };

  const clearOtp = async (phone) => {
    try {
      await fetch(`${API_BASE}/clear-otp/${phone}`, { method: 'DELETE' });
      fetchAllOtps();
    } catch (error) {
      console.error('Failed to clear OTP:', error);
    }
  };

  const reset = () => {
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
    setMessage('');
    setGeneratedOtp('');
    setOtpExpirySeconds(0);
    fetchAllOtps();
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">OTP Verification Demo</h1>
          <p className="text-gray-600">
            Secure phone number verification system with Vite + React
          </p>
          <div
            className={`mt-4 inline-flex items-center px-4 py-2 rounded-full text-sm ${
              backendStatus === 'connected'
                ? 'bg-green-100 text-green-800'
                : backendStatus === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                backendStatus === 'connected'
                  ? 'bg-green-500'
                  : backendStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            {backendStatus === 'connected'
              ? '✓ Backend Connected'
              : backendStatus === 'error'
              ? '✗ Backend Disconnected'
              : '⏳ Connecting to Backend...'}
          </div>
          {backendStatus === 'error' && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              Make sure FastAPI server is running on http://localhost:8000
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              {step === 'phone' ? (
                <Phone className="w-8 h-8 text-blue-600" />
              ) : (
                <Lock className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {step === 'phone' ? 'Enter Phone Number' : 'Enter OTP Code'}
            </h2>
            <p className="text-gray-600 mt-2">
              {step === 'phone'
                ? "We'll send you a verification code"
                : `Code sent to ${phoneNumber}`}
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg mb-6 flex items-center transition-all duration-300 ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {messageType === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          {step === 'phone' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, sendOtp)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-colors"
                  disabled={loading || resendCooldown > 0}
                />
              </div>
              <button
                onClick={sendOtp}
                disabled={loading || !phoneNumber.trim() || resendCooldown > 0}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend OTP in ${resendCooldown}s`
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-2" />
                    Send OTP
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {generatedOtp && showOtp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-800">
                      Demo OTP:
                    </span>
                    <button
                      onClick={() => setShowOtp(!showOtp)}
                      className="text-yellow-600 hover:text-yellow-800 p-1 rounded transition-colors"
                      title={showOtp ? 'Hide OTP' : 'Show OTP'}
                      type="button"
                    >
                      {showOtp ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="text-3xl font-bold text-yellow-900 font-mono tracking-wider">
                    {generatedOtp}
                  </div>
                </div>
              )}

              {otpExpirySeconds > 0 && (
                <div className="text-sm text-red-600 text-center mb-4">
                  OTP expires in {formatTime(otpExpirySeconds)}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  onKeyPress={(e) => handleKeyPress(e, verifyOtp)}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-center font-mono tracking-widest transition-colors"
                  disabled={loading}
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Enter the 6-digit code
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Verify OTP
                    </>
                  )}
                </button>
                <button
                  onClick={reset}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Demo Control Panel */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Demo Control Panel</h3>
            <button
              onClick={() => setShowOtp(!showOtp)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                showOtp
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              type="button"
            >
              {showOtp ? (
                <Eye className="w-4 h-4 mr-2" />
              ) : (
                <EyeOff className="w-4 h-4 mr-2" />
              )}
              {showOtp ? 'Hide OTP' : 'Show OTP'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">Active OTPs</h4>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {Object.keys(allOtps).length} active
                </span>
              </div>

              {Object.keys(allOtps).length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No active OTPs</p>
                  <p className="text-gray-400 text-xs">Send an OTP to see it here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(allOtps).map(([phone, data]) => (
                    <div
                      key={phone}
                      className="bg-white rounded-lg p-3 border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-800">{phone}</span>
                        <button
                          onClick={() => clearOtp(phone)}
                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                          title="Clear OTP"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>OTP:</span>
                          <span className="font-mono font-semibold">
                            {showOtp ? data.otp : '••••••'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{new Date(data.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attempts:</span>
                          <span className={data.attempts > 0 ? 'text-orange-600' : ''}>
                            {data.attempts}/3
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              data.verified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {data.verified ? '✓ Verified' : '○ Pending'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              data.expired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {data.expired ? '✗ Expired' : '✓ Valid'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
