
import React from 'react';
import Simulation from './components/Simulation';

const App: React.FC = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen antialiased">
      <main className="container mx-auto p-4">
        <header className="text-center my-6">
          <h1 className="text-4xl font-bold text-yellow-300">계절은 왜 변할까?</h1>
          <p className="text-lg text-gray-300 mt-2">지구의 자전축 기울기와 공전에 따른 계절의 변화를 알아봐요!</p>
        </header>
        <Simulation />
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>초등학생을 위한 교육용 과학 콘텐츠</p>
      </footer>
    </div>
  );
};

export default App;
