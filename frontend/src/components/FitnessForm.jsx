import React, { useState } from 'react';
export const FitnessForm = ({ onSubmit, onBack, preSelectedSport }) => {
    const [formData, setFormData] = useState({
        age: 25,
        height: 170,
        weight: 70,
        gender: 'male',
        stamina: 'medium',
        previousInjuries: '',
        sportExperience: 'intermediate',
        sport: preSelectedSport,
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'age' || name === 'height' || name === 'weight' ? Number(value) : value
        }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };
    return (<div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700 p-8">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-500 mb-2 text-center">
          Physical Fitness Assessment
        </h2>
        <p className="text-gray-300 text-center mb-6">
          Help us personalize your training plan and dietary recommendations
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Age <span className="text-red-400">*</span>
              </label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} min="10" max="100" required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none"/>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gender <span className="text-red-400">*</span>
              </label>
              <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Height (cm) <span className="text-red-400">*</span>
              </label>
              <input type="number" name="height" value={formData.height} onChange={handleChange} min="100" max="250" required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none"/>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Weight (kg) <span className="text-red-400">*</span>
              </label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} min="30" max="200" required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none"/>
            </div>

            {/* Stamina */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stamina Level <span className="text-red-400">*</span>
              </label>
              <select name="stamina" value={formData.stamina} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Sport Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Experience Level in {formData.sport} <span className="text-red-400">*</span>
              </label>
              <select name="sportExperience" value={formData.sportExperience} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Previous Injuries */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Previous Injuries (if any)
            </label>
            <textarea name="previousInjuries" value={formData.previousInjuries} onChange={handleChange} rows={3} placeholder="List any previous injuries or conditions we should know about..." className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none resize-none"/>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onBack} className="flex-1 px-6 py-3 text-lg font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50">
              Back
            </button>
            <button type="submit" className="flex-1 px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50">
              Start Analysis
            </button>
          </div>
        </form>
      </div>
    </div>);
};
