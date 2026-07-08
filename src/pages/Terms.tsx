import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card } from '../components/ui';

export function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-500 px-8 py-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Terms of Safe Use</h1>
            </div>
            <p className="text-indigo-100 text-sm">Action Heroes — Rules for Heroes</p>
          </div>

          <div className="p-8 space-y-6 text-gray-700 text-sm leading-relaxed">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
              <p className="font-semibold">👋 Hello, Hero!</p>
              <p className="mt-1">These rules keep Action Heroes fun, fair, and safe for everyone. Please read them carefully before using the platform.</p>
            </div>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">1. Who Can Use Action Heroes</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>You must be at least 10 years old to create a participant account</li>
                <li>Admins must be approved by the Main Admin before accessing the platform</li>
                <li>Parents and guardians can create accounts to monitor their child's progress</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">2. Honesty Rules (Very Important!)</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Submit only activities you actually completed</li>
                <li>Write honest, detailed descriptions of what you did</li>
                <li>Upload real proof photos related to your activity</li>
                <li>Do not copy another person's description</li>
                <li>Do not submit the same activity multiple times for extra points</li>
                <li>Submitting false activities is cheating and may result in a 100-point penalty</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">3. Username Rules</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Your username must not contain inappropriate words</li>
                <li>Do not include your real name, phone number, or email in your username</li>
                <li>Usernames must be unique and appropriate for all ages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">4. Photo Upload Rules</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Only upload photos related to your activity</li>
                <li>Do not upload photos of people's faces</li>
                <li>Do not upload private documents, IDs, addresses, or anything personal</li>
                <li>Only JPG, PNG, and WebP image files are accepted (max 5 MB)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">5. Hero Points Rules</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Points are only awarded after an admin reviews and approves your submission</li>
                <li>Denied submissions earn 0 points</li>
                <li>Spending points on Hero Rewards only happens after your parent approves</li>
                <li>Points cannot be transferred between accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">6. Admin Decisions</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Admins may approve, deny, flag, or ask for more information about your submission</li>
                <li>If an admin needs more info, you will be notified and can update your submission</li>
                <li>Admin decisions are final for each submission</li>
                <li>Accounts may be suspended for repeated violations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">7. Hero Rewards</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Hero Rewards must be approved by your parent or guardian before points are deducted</li>
                <li>Your parent has the final decision on reward approvals</li>
                <li>Be responsible with screen time and other rewards — balance is important!</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">8. Good Behavior</h2>
              <p>Action Heroes is a positive, kind, and encouraging community. Everyone deserves to feel safe and motivated. Please:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Be honest with your submissions</li>
                <li>Celebrate other heroes' achievements</li>
                <li>Never try to cheat or take advantage of the system</li>
              </ul>
            </section>

            <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
              These terms may be updated periodically. Continued use of the platform means you agree to the current terms.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
