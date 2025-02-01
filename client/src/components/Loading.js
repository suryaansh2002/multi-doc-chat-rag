import { Loader } from 'lucide-react';

export default function Loading({ size = 'default', className = '' }) {
    const sizeClasses = {
        small: 'w-4 h-4',
        default: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    return (
        <div className="flex justify-center items-center">
            <Loader
                className={`animate-spin ${sizeClasses[size]} ${className}`}
            />
        </div>
    );
}