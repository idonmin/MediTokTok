import { LogIn, LogOut } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAuth } from './auth-context.js';

function ClayAvatar({ compact = false }) {
  return (
    <span className={`clay-avatar${compact ? ' compact' : ''}`} aria-hidden="true">
      <span className="clay-avatar-hair" />
      <span className="clay-avatar-ear left" />
      <span className="clay-avatar-ear right" />
      <span className="clay-avatar-face">
        <span className="clay-avatar-brow left" />
        <span className="clay-avatar-brow right" />
        <span className="clay-avatar-eye left" />
        <span className="clay-avatar-eye right" />
        <span className="clay-avatar-cheek left" />
        <span className="clay-avatar-cheek right" />
        <span className="clay-avatar-smile" />
      </span>
      {!compact && (
        <span className="clay-avatar-body" />
      )}
    </span>
  );
}

export function ProfileMenu({ onSignIn }) {
  const { loading, signOut, user } = useAuth();
  const menuRef = useRef(null);
  const profileName = user?.user_metadata?.full_name || user?.user_metadata?.name || '메디톡톡 사용자';

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  useEffect(() => {
    const closeWhenClickingOutside = (event) => {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    };
    const closeWithEscape = (event) => {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeWhenClickingOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeWhenClickingOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  const handleSignIn = async () => {
    closeMenu();
    await onSignIn?.();
  };

  const handleSignOut = async () => {
    closeMenu();
    await signOut();
  };

  return (
    <details className="profile-menu" ref={menuRef}>
      <summary aria-label="사용자 프로필 보기" title="사용자 프로필">
        <ClayAvatar compact />
      </summary>
      <div className="profile-popover">
        <div className="profile-avatar">
          <ClayAvatar />
        </div>
        {user ? (
          <>
            <strong>{profileName}</strong>
            <span>{user.email}</span>
            <button className="profile-action" type="button" onClick={handleSignOut}><LogOut size={16} />로그아웃</button>
          </>
        ) : (
          <>
            <strong>로그인이 필요합니다</strong>
            <span>Google 계정으로 로그인하면 모든 메뉴를 이용할 수 있습니다.</span>
            {onSignIn && <button className="profile-action" type="button" onClick={handleSignIn} disabled={loading}><LogIn size={16} />Google로 로그인</button>}
          </>
        )}
      </div>
    </details>
  );
}
