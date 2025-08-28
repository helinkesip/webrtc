import ChatInterface from '@/components/ChatInterface';
import FloatingParticles from '@/components/FloatingParticles';

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic background particles */}
      <FloatingParticles />
      
      {/* Main chat interface */}
      <div className="relative z-10 h-screen">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Index;
