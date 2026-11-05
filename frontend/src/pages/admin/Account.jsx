import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/format';
import Seo from '../../components/ui/Seo';
import PageHeader from '../../components/admin/PageHeader';
import { PasswordForm, ProfileForm } from '../../components/account/AccountForms';

export default function AdminAccount() {
  const { user, setUser } = useAuth();
  const since = user.createdAt ? ` · Admin since ${formatDate(user.createdAt, { month: 'long', year: 'numeric' })}` : '';

  return (
    <>
      <Seo title="Your account" noindex />
      <PageHeader title="Your account" description={`${user.email}${since}`} />

      <div className="adm-account">
        <section className="card card-pad" aria-labelledby="adm-account-profile">
          <h2 id="adm-account-profile" className="acct-panel-title">Profile</h2>
          <p className="acct-panel-sub">Your name appears in the admin panel and on the store.</p>
          <ProfileForm
            user={user}
            onSaved={(profile) => setUser(u => ({ ...u, ...profile }))}
            phoneHint="Shown only to other admins"
            emailHint="This is your admin sign-in email and can't be changed here."
          />
        </section>

        <section className="card card-pad" aria-labelledby="adm-account-password">
          <h2 id="adm-account-password" className="acct-panel-title">Password</h2>
          <p className="acct-panel-sub">You stay signed in on this device after changing it.</p>
          <PasswordForm />
        </section>
      </div>
    </>
  );
}
