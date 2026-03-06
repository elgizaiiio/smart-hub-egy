import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const LegalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isTerms = location.pathname === "/terms";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="font-display text-2xl font-bold text-foreground mb-6">{isTerms ? "Terms of Service" : "Privacy Policy"}</h1>

        <div className="prose-chat space-y-4 text-foreground text-sm leading-relaxed">
          {isTerms ? (
            <>
              <p><strong>Last updated:</strong> March 2026</p>
              <p>Welcome to Megsy. By using our services, you agree to these terms.</p>
              <h3 className="font-display font-semibold text-base mt-6">1. Use of Services</h3>
              <p>You must be at least 13 years old to use Megsy. You are responsible for maintaining the security of your account.</p>
              <h3 className="font-display font-semibold text-base mt-6">2. Credits & Billing</h3>
              <p>Megsy operates on a credit-based system. Credits are non-refundable once used. Subscription plans auto-renew unless cancelled.</p>
              <h3 className="font-display font-semibold text-base mt-6">3. Content</h3>
              <p>You retain rights to content you create. AI-generated content is provided as-is. You are responsible for how you use generated content.</p>
              <h3 className="font-display font-semibold text-base mt-6">4. Prohibited Use</h3>
              <p>Do not use Megsy for illegal activities, generating harmful content, or attempting to reverse-engineer our systems.</p>
              <h3 className="font-display font-semibold text-base mt-6">5. Limitation of Liability</h3>
              <p>Megsy is provided "as is" without warranties. We are not liable for any damages arising from use of our services.</p>
            </>
          ) : (
            <>
              <p><strong>Last updated:</strong> March 2026</p>
              <p>Your privacy is important to us. This policy describes how Megsy collects, uses, and protects your data.</p>
              <h3 className="font-display font-semibold text-base mt-6">1. Data We Collect</h3>
              <p>We collect email addresses, usage data, and content you create. We do not sell your personal data to third parties.</p>
              <h3 className="font-display font-semibold text-base mt-6">2. How We Use Data</h3>
              <p>To provide and improve our services, process payments, send important notifications, and ensure security.</p>
              <h3 className="font-display font-semibold text-base mt-6">3. Data Storage</h3>
              <p>Your data is stored securely using industry-standard encryption. We use Supabase for database management.</p>
              <h3 className="font-display font-semibold text-base mt-6">4. Your Rights</h3>
              <p>You can request access to, correction of, or deletion of your personal data at any time by contacting support.</p>
              <h3 className="font-display font-semibold text-base mt-6">5. Contact</h3>
              <p>For privacy inquiries, contact us at privacy@megsy.ai</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
