import { useState } from 'react';
import MeditateHub from '../components/meditate/MeditateHub';
import CourseLibrary from '../components/meditate/CourseLibrary';
import MemberPracticesPortal from '../components/meditate/MemberPracticesPortal';
import MemberPracticesView from '../components/meditate/MemberPracticesView';

export default function Meditate() {
  const [collectiveStage, setCollectiveStage] = useState(null);

  // When in collective mode, render overlay constrained to 480px
  if (collectiveStage) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center">
        <div className="relative w-full max-w-[480px] h-screen bg-black">
          <MemberPracticesView
            filterStage={collectiveStage}
            onBack={() => setCollectiveStage(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6 pt-2">
      {/* Hero — full bleed, no px constraint */}
      <MeditateHub />

      <div className="px-4" style={{ maxWidth: 480, margin: '0 auto' }}>
        <CourseLibrary />
        <MemberPracticesPortal onEnterField={setCollectiveStage} />
      </div>
    </div>
  );
}
