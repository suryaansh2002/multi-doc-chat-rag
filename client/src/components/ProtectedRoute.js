import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = (WrappedComponent) => {
    return (props) => {
        const { isAuthenticated, loading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!loading && !isAuthenticated) {
                router.replace('/login');
            }
        }, [loading, isAuthenticated, router]);

        if (loading) {
            return <div>Loading...</div>;
        }

        if (!isAuthenticated) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
};

export default ProtectedRoute;