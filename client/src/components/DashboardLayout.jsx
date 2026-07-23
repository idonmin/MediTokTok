import { BarChart3, BookOpen, LogOut, MessageSquareText } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context.js';
import { CollectionPanel } from '../features/collection/CollectionPanel.jsx';

const links = [
  { to: '/app/overview', label: '개요', icon: BarChart3 },
  { to: '/app/papers', label: '논문 목록', icon: BookOpen },
  { to: '/app/chat', label: '챗봇', icon: MessageSquareText },
];

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="랜딩페이지로 이동">메디톡톡</Link>
        <CollectionPanel />
        <div className="sidebar-user">
          <span>{user?.email || '개발용 데모 사용자'}</span>
          {user && <button className="icon-button" onClick={signOut} aria-label="로그아웃"><LogOut size={17} /></button>}
        </div>
      </aside>
      <main className="workspace">
        <header className="workspace-header">
          <nav className="tabs">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}><Icon size={17} />{label}</NavLink>
            ))}
          </nav>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
