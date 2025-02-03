import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (router.query.email) {
            setEmail(router.query.email);
        } else {
            router.push('/forgot-password');
        }
    }, [router.query, router.push]); // Added router.push to dependencies

    useEffect(() => {
        if (confirmPassword) {
            setPasswordsMatch(newPassword === confirmPassword);
        }
    }, [newPassword, confirmPassword]);

    const verifyOtp = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-reset-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid OTP');
            }

            setOtpVerified(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otpVerified) {
            await verifyOtp();
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            router.push('/login?reset=success');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    {otpVerified ? 'Set new password' : 'Verify reset code'}
                </h2>
                {!otpVerified && (
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Enter the code sent to your email
                    </p>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded relative">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Email
                            </label>
                            <div className="mt-1">
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-300">
                                Reset Code
                            </label>
                            <div className="mt-1">
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    disabled={otpVerified}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {otpVerified && (
                            <>
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
                                        New Password
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="newPassword"
                                            name="newPassword"
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                                        Confirm New Password
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                                confirmPassword && !passwordsMatch 
                                                    ? 'border-red-500' 
                                                    : 'border-gray-600'
                                            }`}
                                        />
                                    </div>
                                    {confirmPassword && !passwordsMatch && (
                                        <p className="mt-1 text-sm text-red-500">
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading || (otpVerified && !passwordsMatch)}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {loading ? 'Processing...' : (otpVerified ? 'Reset Password' : 'Verify Code')}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-800 text-gray-400">
                                    <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                                        Back to login
                                    </Link>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
