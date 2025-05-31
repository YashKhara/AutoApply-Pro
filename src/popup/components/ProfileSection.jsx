// src/popup/components/ProfileSection.jsx
import React from 'react';
import { useStore } from '../store/useStore';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

const InputField = ({ label, type = 'text', value, onChange, placeholder, className = "" }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
    />
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder, className = "" }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows="3"
      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
    ></textarea>
  </div>
);

const ProfileSection = () => {
  const { profile, updateProfile, addEducation, updateEducation, deleteEducation, addExperience, updateExperience, deleteExperience } = useStore();

  const handleEducationChange = (id, field, value) => {
    updateEducation(id, { [field]: value });
  };

  const handleExperienceChange = (id, field, value) => {
    updateExperience(id, { [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>

      {/* Basic Contact Info */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-3">Contact Details</h3>
        <InputField
          label="Full Name"
          value={profile.name}
          onChange={(e) => updateProfile({ name: e.target.value })}
          placeholder="John Doe"
        />
        <InputField
          label="Email Address"
          type="email"
          value={profile.email}
          onChange={(e) => updateProfile({ email: e.target.value })}
          placeholder="john.doe@example.com"
        />
        <InputField
          label="Phone Number"
          type="tel"
          value={profile.phone}
          onChange={(e) => updateProfile({ phone: e.target.value })}
          placeholder="+1234567890"
        />
        <InputField
          label="LinkedIn Profile URL"
          type="url"
          value={profile.linkedInUrl}
          onChange={(e) => updateProfile({ linkedInUrl: e.target.value })}
          placeholder="https://www.linkedin.com/in/your-profile/"
        />
      </div>

      {/* Skills and Experience Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-3">Summary & Skills</h3>
        <InputField
          label="Years of Experience"
          type="number"
          value={profile.yearsExperience}
          onChange={(e) => updateProfile({ yearsExperience: e.target.value })}
          placeholder="5"
        />
        <TextAreaField
          label="Key Skills (comma-separated)"
          value={profile.keySkills}
          onChange={(e) => updateProfile({ keySkills: e.target.value })}
          placeholder="React, JavaScript, Node.js, AWS, Python"
        />
      </div>

      {/* Education Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-medium text-gray-800">Education</h3>
          <button
            onClick={() => addEducation({ degree: '', major: '', university: '', graduationYear: '' })}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
            title="Add Education"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        {profile.education.map((edu, index) => (
          <div key={edu.id} className="border border-gray-200 p-3 rounded-md mb-3 last:mb-0 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={() => deleteEducation(edu.id)}
                className="text-red-500 hover:text-red-700"
                title="Remove Education"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <InputField
              label="Degree"
              value={edu.degree}
              onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
              placeholder="Bachelor of Science"
            />
            <InputField
              label="Major"
              value={edu.major}
              onChange={(e) => handleEducationChange(edu.id, 'major', e.target.value)}
              placeholder="Computer Science"
            />
            <InputField
              label="University"
              value={edu.university}
              onChange={(e) => handleEducationChange(edu.id, 'university', e.target.value)}
              placeholder="University of Example"
            />
            <InputField
              label="Graduation Year"
              type="number"
              value={edu.graduationYear}
              onChange={(e) => handleEducationChange(edu.id, 'graduationYear', e.target.value)}
              placeholder="2020"
            />
          </div>
        ))}
        {profile.education.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">No education added yet.</p>
        )}
      </div>

      {/* Experience Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-medium text-gray-800">Work Experience</h3>
          <button
            onClick={() => addExperience({ title: '', company: '', startMonthYear: '', endMonthYear: '', description: '' })}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
            title="Add Experience"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        {profile.experience.map((exp, index) => (
          <div key={exp.id} className="border border-gray-200 p-3 rounded-md mb-3 last:mb-0 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={() => deleteExperience(exp.id)}
                className="text-red-500 hover:text-red-700"
                title="Remove Experience"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <InputField
              label="Job Title"
              value={exp.title}
              onChange={(e) => handleExperienceChange(exp.id, 'title', e.target.value)}
              placeholder="Software Engineer"
            />
            <InputField
              label="Company"
              value={exp.company}
              onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
              placeholder="Tech Solutions Inc."
            />
            <InputField
              label="Start Date (MM/YYYY)"
              value={exp.startMonthYear}
              onChange={(e) => handleExperienceChange(exp.id, 'startMonthYear', e.target.value)}
              placeholder="01/2020"
            />
            <InputField
              label="End Date (MM/YYYY) (or 'Present')"
              value={exp.endMonthYear}
              onChange={(e) => handleExperienceChange(exp.id, 'endMonthYear', e.target.value)}
              placeholder="01/2024 or Present"
            />
            <TextAreaField
              label="Description (Key responsibilities/achievements)"
              value={exp.description}
              onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)}
              placeholder="Developed and maintained web applications..."
            />
          </div>
        ))}
        {profile.experience.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">No work experience added yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;