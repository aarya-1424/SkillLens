// The Terms of Service and Privacy Policy.
//
// Every promise here is something the app actually does. If you change a
// promise, change the code that keeps it (backend/app/privacy/) and bump
// POLICY_VERSION in BOTH this file and backend/app/privacy/policy.py, so
// every signed-in person is asked to read and agree again.

export const POLICY_VERSION = '2026-11-24b';
export const POLICY_LABEL = 'Version 1.2';
// 1.2: parent confirmation by email marked "coming soon" (Privacy s.3, s.7).
export const EFFECTIVE = '24 November 2026';
// 1.1: added sharing with a coach, only when you join their team (Privacy s.5, s.8; Terms s.6).
export const DELETION_GRACE_DAYS = 30;
export const RESPONSE_DAYS = 30;

// SkillLens is an independent, personal project. It is not run by, or part
// of, any company. Fill these in when there is a published name and contact
// address for the person running it; until then the pages point people to the
// complaint form inside the App, which is recorded and dated.
export const OWNER = {
  name: null, // e.g. 'Your full name'
  email: null, // e.g. a dedicated SkillLens contact address
};

const CONTACT = 'Privacy & data in the App ("Ask about my data", or "Raise a privacy complaint")';

// A paragraph is a string. A list is { list: [...] }. A note is { note: '...' }.

export const PRIVACY = {
  title: 'Privacy Policy',
  intro: 'How SkillLens collects, uses, shares and protects your information, and how you stay in control of it.',
  short: [
    'Your videos never leave your device. Only the measurements taken from them are saved.',
    'Your answers and reports are private to you.',
    'The AI that writes summaries gets your numbers, never your name, email, photo, exact age or weight. You can switch it off.',
    'You can download everything, or delete everything, yourself, at any time, from Privacy & data.',
    'A coach sees your reports only if you join their team, and stops the moment you leave.',
  ],
  sections: [
    {
      id: 'overview', title: '1. Overview',
      body: [
        'SkillLens ("the App") is an independent, personal project, run by its creator ("we", "us"). It is not a product of any company. It is an AI sports coach that measures your technique from a short video. This policy explains what we collect, why, who we share it with, how long we keep it, and how you use your rights. It follows India\'s Digital Personal Data Protection Act, 2023 ("DPDP Act") and the Information Technology Act, 2000. Under the DPDP Act you are the "Data Principal" and the person who runs SkillLens is the "Data Fiduciary".',
      ],
    },
    {
      id: 'collect', title: '2. What we collect',
      body: [
        'We collect only what the App needs:',
        { list: [
          'Account: your name, email address and profile photo, which Google shares with us when you choose "Continue with Google".',
          'Athlete profile (the setup questions): what to call you, month and year of birth, gender, main sport, role, level, years playing, training days, dominant hand and foot, height, weight, fitness, any pain and where, past injuries, and your goal. Some of this is about your health, so we treat it with extra care.',
          'Reports: the joint measurements taken from your video, your scores, injury-risk rating, the coaching words shown to you, and any AI summary.',
          'Ask Coach: the questions you ask and the answers you get.',
          'Consent records: which version of these terms you agreed to and when. For anyone under 18, their parent or guardian\'s name, email and the time they agreed.',
          'Privacy requests: what you asked us for, when, and our reply.',
          'Technical: our hosting providers keep standard server logs (IP address, time, and the address requested) for security and fixing faults.',
        ] },
        { note: 'What we do NOT collect: your videos. A video you record or upload is read inside your own browser to find body positions. The video itself is never sent to us and never stored by us. We also never ask for your exact date of birth, your location or your contacts, and we use no advertising, analytics or tracking tools.' },
      ],
    },
    {
      id: 'basis', title: '3. Why we are allowed to use it',
      body: [
        'Consent: you agree during setup, after reading this policy. You can withdraw consent at any time (see section 8); this does not undo what was lawfully done before.',
        'Children: for anyone under 18, the DPDP Act requires a parent or guardian\'s consent. Today we record the parent or guardian\'s name, email and agreement given at sign-up. Confirmation by email is coming soon (see section 7).',
        'Legitimate uses: keeping the App secure, and meeting our legal duties.',
      ],
    },
    {
      id: 'use', title: '4. How we use it',
      body: [
        { list: [
          'To create and run your account.',
          'To measure and score your technique, save your reports and show your progress.',
          'To fit the advice to you: your age group, level, goal, and any sore areas.',
          'To answer your Ask Coach questions.',
          'To keep the App secure and fix faults.',
          'To meet our legal duties.',
        ] },
        'We never use your information for advertising. We never track children\'s behaviour or target them with ads. We do not currently use your information to train any AI model.',
      ],
    },
    {
      id: 'sharing', title: '5. Who we share it with',
      body: [
        'We never sell or rent your information. We use these service providers to run the App, and share only what each one needs:',
        { list: [
          'Supabase: sign-in and our database, where your account, athlete profile, reports and Ask Coach messages are stored. Hosted on Amazon Web Services.',
          'Render: runs our server, in Singapore.',
          'Vercel: delivers the website to your browser.',
          'Google: sign-in, only when you choose "Continue with Google". Your browser also downloads the body-tracking model from Google\'s servers and from jsDelivr; like any website visit, they see your IP address. Nothing about you or your video is sent in that step.',
          'Groq: the AI model that writes report summaries and Ask Coach answers, located in the United States. We send it your report\'s numbers and coaching words, your question, and a short, general description of you (for example: age group "15 to 17", level, goal, sore areas). We never send your name, email, photo, exact age, height, weight or video. You can switch this off in Privacy & data; while it is off, nothing is sent.',
          'Your coach, only if you choose: if you join a coach\'s team with their invite code, that coach can see your name, age group (not your exact age), level and role, any sore areas you told us about, your scores, injury-risk ratings and reports. They never see your Ask Coach messages, email, exact age, height, weight or videos. Leave the team at any time and the coach loses access at once. Anyone under 18 needs a parent or guardian\'s agreement to join a team.',
          'Legal authorities: only where the law, a court or a government authority requires it.',
        ] },
        'Cross-border transfer: some of these providers store or process information outside India (for example Singapore and the United States). We share the minimum needed with each of them.',
      ],
    },
    {
      id: 'retention', title: '6. How long we keep it',
      body: [
        { list: [
          'While your account is open, we keep your account, athlete profile, reports and Ask Coach messages so you can see your progress.',
          'Delete a report, or clear your Ask Coach history, and it is removed straight away. Leave a team and its coach can no longer see anything of yours.',
          `Delete your account and you have ${DELETION_GRACE_DAYS} days to change your mind: sign in and press "Cancel deletion". When the ${DELETION_GRACE_DAYS} days end, everything is permanently erased automatically, including your sign-in record with our sign-in provider.`,
          'Your privacy log (what you asked and what we did) is kept as proof that we kept our promises. When your account is erased it is made anonymous: it no longer links to you and any text you wrote is removed.',
          'Ask Coach answers are also kept in a shared answer store so the same question costs nothing twice. It holds the answer and a fingerprint of the question, not who asked.',
          'Server logs are kept by our hosting providers for a limited time under their own policies.',
          'The tour (no sign-in) keeps your answers only in your own browser. They are removed when you leave the tour or clear your browser data.',
        ] },
      ],
    },
    {
      id: 'children', title: '7. Children',
      body: [
        'SkillLens is for athletes aged 5 and over. Anyone under 18 needs a parent or guardian to agree during sign-up, and we record their name, email and when they agreed. Coming soon: we will also email the parent or guardian a private link, and once that is switched on we will save nothing about the child (no reports, no Ask Coach, no sharing with a coach) until the parent opens it and agrees. A parent or guardian can use any of the rights below on their child\'s behalf, from the child\'s account or by sending a "Request from a parent or guardian" in Privacy & data, or by writing to our Grievance Officer.',
      ],
    },
    {
      id: 'rights', title: '8. Your rights, and the button for each',
      body: [
        'You can use most of your rights yourself, straight away, under Privacy & data in the App:',
        { list: [
          'Access and portability: "Download my data" gives you everything we hold in one file, at once.',
          'Correction: edit your profile at any time. For anything else, send a "Correct my data" request.',
          'Erasure: delete a single report, clear your Ask Coach history, or delete your account.',
          'Withdraw consent: switch AI features off at any time, or leave any team to stop sharing with its coach. To withdraw entirely, delete your account.',
          `Grievance: "Raise a privacy complaint". We reply within ${RESPONSE_DAYS} days.`,
          'Nominate: name someone to act for you if you die or cannot act yourself, by sending a request.',
        ] },
        'Everything you do here is recorded in your privacy log, which you can see in the App.',
      ],
    },
    {
      id: 'security', title: '9. Keeping it safe',
      body: [
        { list: [
          'All traffic between your device and our servers is encrypted (HTTPS).',
          'Our database provider encrypts stored data.',
          'Each person can only ever see their own information. Our server checks this on every request, and automated tests check it on every change we make.',
          'Secret keys stay on our server and are never sent to your browser.',
          'The AI gets the least information it needs (section 5).',
        ] },
        'No system is perfectly secure. If a breach puts your information at risk, we will tell you and the Data Protection Board of India, as the DPDP Act requires.',
      ],
    },
    {
      id: 'storage', title: '10. Cookies and browser storage',
      body: [
        'We use no advertising or analytics cookies. The App uses your browser\'s storage only to keep you signed in, to remember that you are taking the tour, and to keep your unfinished setup answers until you finish. Because nothing optional is stored, there is nothing to switch on or off.',
      ],
    },
    { id: 'grievance', title: '11. Grievance Officer', grievance: true },
    {
      id: 'changes', title: '12. Changes to this policy',
      body: [
        'The version and date are at the top of this page. If we make a meaningful change, the App will ask you to read and agree to the new version before you carry on. We will not quietly change how we use your information.',
      ],
    },
    {
      id: 'contact', title: '13. Contact us',
      body: [
        `For any question, complaint or data request, use ${CONTACT}${OWNER.email ? `, or write to ${OWNER.email}` : ''}. See also section 11.`,
      ],
    },
  ],
};

export const TERMS = {
  title: 'Terms of Service',
  intro: 'The agreement between you and SkillLens for using the App. Please read it before you start.',
  sections: [
    {
      id: 'acceptance', title: '1. Agreeing to these terms',
      body: [
        `SkillLens ("the App") is an independent, personal project run by its creator ("we", "us"); it is not a product of any company. By using it, you agree to these Terms and to our Privacy Policy. SkillLens is for athletes aged 5 and over. If you are under 18, your parent or guardian must agree to these Terms for you during setup. If you do not agree, please do not use the App.`,
      ],
    },
    {
      id: 'service', title: '2. What SkillLens is, and is not',
      body: [
        'SkillLens measures your movement from a short video and compares it with target ranges for your sport. It gives you a score, the things to work on, drills, an injury-risk rating and AI-written explanations.',
        { note: 'SkillLens gives coaching guidance, not medical advice. It does not diagnose injuries or conditions. The injury-risk rating is an estimate from your movement only. It is not a substitute for a doctor, physiotherapist or qualified coach.' },
        'Some target ranges are still waiting for sign-off by a qualified coach; the App marks these clearly. Scores depend on the video: poor light, a hidden body or the wrong camera angle make them less reliable, and the App tells you when it could not see you clearly.',
      ],
    },
    {
      id: 'safety', title: '3. Your safety',
      body: [
        { list: [
          'Warm up, and train within your limits.',
          'Stop if something hurts. If pain carries on, see a doctor or physiotherapist before training again.',
          'Athletes under 18 should train with an adult\'s supervision.',
          'Film somewhere safe, away from traffic, other players and hazards.',
        ] },
      ],
    },
    {
      id: 'accounts', title: '4. Your account',
      body: [
        `You sign in with your Google account. Keep that account secure: you are responsible for what happens under your SkillLens account. Tell us straight away through ${CONTACT} if you think someone else has used it. The tour needs no account; anything you enter there stays in your own browser.`,
      ],
    },
    {
      id: 'others', title: '5. Filming other people',
      body: [
        'Only analyse videos of yourself, or of people who have agreed. For a child, their parent or guardian must agree. Videos are read on your device and are not sent to us, but you are still responsible for having permission to film someone.',
      ],
    },
    {
      id: 'data', title: '6. Your information',
      body: [
        'You own the information you give SkillLens and the reports made from it. You allow us to use it only to provide the App to you, as described in the Privacy Policy. We do not sell it, and we do not currently use it to train AI models. You can download or delete it at any time from Privacy & data.',
      ],
    },
    {
      id: 'coaches', title: '6a. If you coach a team',
      body: [
        'Only invite players who want to join. Use what you see only to coach them, keep it to yourself, and do not copy it elsewhere. Players can leave whenever they like. For players under 18, you should also have their parent or guardian\'s agreement in your own club or academy.',
      ],
    },
    {
      id: 'conduct', title: '7. What you must not do',
      body: [
        { list: [
          'Try to copy, reverse-engineer or extract the App\'s code, scoring rules or models.',
          'Use bots, scrapers or scripts to access the App.',
          'Try to get into anyone else\'s account or information.',
          'Enter false information about someone else, or pretend to be a parent or guardian when you are not.',
          'Use the App for anything unlawful, or resell access to it without our written permission.',
        ] },
      ],
    },
    {
      id: 'ip', title: '8. Our intellectual property',
      body: [
        'The App, including its scoring rules, measurement library, report formats, design and technology, belongs to its creator. You may use it for your own training. The SkillLens name and logo belong to its creator.',
      ],
    },
    {
      id: 'availability', title: '9. Price and availability',
      body: [
        'SkillLens is free while it is a prototype. If we ever introduce charges, we will tell you first and you will not be charged without agreeing. The App may sometimes be slow to wake up or briefly unavailable.',
      ],
    },
    {
      id: 'liability', title: '10. Disclaimers and limits of liability',
      body: [
        'The App is provided "as is" and "as available". We do not promise that every measurement, score or AI-written explanation is accurate or right for you. As far as the law allows, our total liability to you for any claim about the App is limited to the amount you paid us in the three months before the claim (currently nothing, as the App is free), and we are not liable for indirect or consequential loss. Nothing here limits liability that cannot be limited by law.',
      ],
    },
    {
      id: 'ending', title: '11. Ending this agreement',
      body: [
        `You can stop at any time by deleting your account in Privacy & data (you have ${DELETION_GRACE_DAYS} days to change your mind). We may suspend or close an account that breaks these Terms. Sections 6, 8, 10 and 12 continue after the agreement ends.`,
      ],
    },
    {
      id: 'law', title: '12. Governing law',
      body: [
        'These Terms are governed by the laws of India. We will first try to settle any dispute through good-faith discussion. If it is not settled within 30 days, it will be decided by the courts in India that have jurisdiction.',
      ],
    },
    {
      id: 'changes', title: '13. Changes to these terms',
      body: [
        'The version and date are at the top of this page. If we make a meaningful change, the App will ask you to read and agree to the new version before you carry on.',
      ],
    },
    {
      id: 'contact', title: '14. Contact',
      body: [
        `Questions about these Terms: use ${CONTACT}${OWNER.email ? `, or write to ${OWNER.email}` : ''}. Privacy questions and complaints: see the Privacy Policy, section 11.`,
      ],
    },
  ],
};
