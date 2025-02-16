import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from 'next/image';

// Validation utilities
// const validateEmail = (email) => {
//   const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//   return re.test(String(email).toLowerCase());
// };

const validatePhoneNumber = (phone) => {
  // International phone number validation (E.164 format)
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phone);
};

const PROJECT_STATUSES = [
  'planning', 
  'in-progress', 
  'completed', 
  'on-hold'
];

const PROJECT_TYPES = [
  'apartment', 
  'villa', 
  'mansion'
];

export default function ProjectForm({ 
  initialProject = null, 
  onSubmit, 
  teamMembers = [] 
}) {
  const [project, setProject] = useState({
    name: '',
    dateStarted: '',
    location: '',
    contactPhone: '',
    projectManager: '',
    projectStatus: 'planning',
    totalUnits: 0,
    projectType: 'apartment',
    representativeImage: null
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialProject) {
      setProject({
        ...initialProject,
        dateStarted: initialProject.dateStarted ? 
          new Date(initialProject.dateStarted).toISOString().split('T')[0] : 
          ''
      });
    }
  }, [initialProject]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'representativeImage' && files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Validate image size and type
        const img = new window.Image(); // Explicitly use window.Image
        img.onload = () => {
          if (img.width > 1024 || img.height > 1024) {
            toast.error('Image must be max 1024x1024 pixels');
            return;
          }
          const imageData = reader.result;
          if (typeof imageData === 'string' && imageData.length > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Image must be less than 5MB');
            return;
          }
          setProject(prev => ({
            ...prev,
            representativeImage: imageData
          }));
        };
        img.onerror = () => {
          toast.error('Invalid image file');
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(files[0]);
    } else {
      setProject(prev => ({
        ...prev,
        [name]: name === 'totalUnits' ? Number(value) : value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!project.name) newErrors.name = 'Project name is required';
    if (!project.location) newErrors.location = 'Location is required';
    
    if (project.contactPhone && !validatePhoneNumber(project.contactPhone)) {
      newErrors.contactPhone = 'Invalid phone number format';
    }
    
    if (project.dateStarted && isNaN(Date.parse(project.dateStarted))) {
      newErrors.dateStarted = 'Invalid date format';
    }
    
    if (project.totalUnits < 0) {
      newErrors.totalUnits = 'Total units cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    try {
      await onSubmit({
        ...project,
        dateStarted: project.dateStarted ? 
          new Date(project.dateStarted).toISOString() : 
          null
      });
      toast.success(initialProject ? 'Project Updated' : 'Project Created');
    } catch (error) {
      toast.error(error.message || 'Failed to save project');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-2">
      <div>
        <Label>Project Name *</Label>
        <Input 
          name="name"
          value={project.name}
          onChange={handleChange}
          placeholder="Enter project name"
          required
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      <div>
        <Label>Date Started</Label>
        <Input 
          type="date"
          name="dateStarted"
          value={project.dateStarted}
          onChange={handleChange}
        />
        {errors.dateStarted && <p className="text-red-500 text-sm">{errors.dateStarted}</p>}
      </div>

      <div>
        <Label>Location *</Label>
        <Input 
          name="location"
          value={project.location}
          onChange={handleChange}
          placeholder="Enter project location"
          required
        />
        {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
      </div>
      <div>
        <Label>Contact Phone</Label>
        <Input 
          name="contactPhone"
          value={project.contactPhone}
          onChange={handleChange}
          placeholder="+1234567890"
        />
        {errors.contactPhone && <p className="text-red-500 text-sm">{errors.contactPhone}</p>}
      </div>

      <div>
        <Label>Project Manager</Label>
        <Select 
          name="projectManager"
          value={project.projectManager}
          onValueChange={(value) => setProject(prev => ({...prev, projectManager: value}))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Project Manager" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map(member => (
              <SelectItem key={member._id} value={member._id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Project Status</Label>
        <Select 
          name="projectStatus"
          value={project.projectStatus}
          onValueChange={(value) => setProject(prev => ({...prev, projectStatus: value}))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Project Status" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_STATUSES.map(status => (
              <SelectItem key={status} value={status}>
                {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Total Units</Label>
        <Input 
          type="number"
          name="totalUnits"
          value={project.totalUnits}
          onChange={handleChange}
          min="0"
        />
        {errors.totalUnits && <p className="text-red-500 text-sm">{errors.totalUnits}</p>}
      </div>

      <div>
        <Label>Project Type</Label>
        <Select 
          name="projectType"
          value={project.projectType}
          onValueChange={(value) => setProject(prev => ({...prev, projectType: value}))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Project Type" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {type.replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Representative Image</Label>
        <Input 
          type="file"
          name="representativeImage"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
        />
        {project.representativeImage && (
          <Image 
            src={project.representativeImage} 
            alt="Project Preview"
            width={100}
            height={100}
            className="mt-2 max-w-[200px] max-h-[200px]"
          />
        )}
      </div>

      <Button type="submit" className="w-full">
        {initialProject ? 'Update Project' : 'Create Project'}
      </Button>
    </form>
  );
}
