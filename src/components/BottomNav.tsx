import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Apple, BarChart3, User } from 'lucide-react';

const tabs = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/workout', icon: Dumbbell, label: 'Trening' },
    { path: '/diet', icon: Apple, label: 'Dieta' },
    { path: '/workout/pr', icon: BarChart3, label: 'Statsy' },
    { path: '/profile', icon: User, label: 'Profil' },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    // Hide nav during active workout
    if (location.pathname === '/workout/active') return null;

    return (
        <nav className="bottom-nav">
            {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                    <div
                        key={tab.path}
                        className={`nav-item ${isActive(tab.path) ? 'active' : ''}`}
                        onClick={() => navigate(tab.path)}
                    >
                        <Icon size={22} strokeWidth={1.5} className="nav-icon" />
                        <span className="nav-label">{tab.label}</span>
                    </div>
                );
            })}
        </nav>
    );
}
