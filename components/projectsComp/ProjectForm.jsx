import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from 'next/image';

const validatePhoneNumber = (phone) => {
  const digitCount = phone.replace(/\D/g, '').length;
  return digitCount > 9;
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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Project Name *</Label>
          <Input 
            name="name"
            value={project.name}
            onChange={handleChange}
            placeholder="Enter project name"
            required
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        {/* Date Started */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Started</Label>
          <Input 
            type="date"
            name="dateStarted"
            value={project.dateStarted}
            onChange={handleChange}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {errors.dateStarted && <p className="text-red-500 text-sm">{errors.dateStarted}</p>}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Location *</Label>
          <Input 
            name="location"
            value={project.location}
            onChange={handleChange}
            placeholder="Enter project location"
            required
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
        </div>

        {/* Contact Phone */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Contact Phone</Label>
          <Input 
            name="contactPhone"
            value={project.contactPhone}
            onChange={handleChange}
            placeholder="0745678900"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {errors.contactPhone && <p className="text-red-500 text-sm">{errors.contactPhone}</p>}
        </div>

        {/* Project Manager */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Project Manager</Label>
          <Select 
            name="projectManager"
            value={project.projectManager}
            onValueChange={(value) => setProject(prev => ({...prev, projectManager: value}))}
          >
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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

        {/* Project Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Project Status</Label>
          <Select 
            name="projectStatus"
            value={project.projectStatus}
            onValueChange={(value) => setProject(prev => ({...prev, projectStatus: value}))}
          >
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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

        {/* Total Units */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Total Units</Label>
          <Input 
            type="number"
            name="totalUnits"
            value={project.totalUnits}
            onChange={handleChange}
            min="0"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {errors.totalUnits && <p className="text-red-500 text-sm">{errors.totalUnits}</p>}
        </div>

        {/* Project Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Project Type</Label>
          <Select 
            name="projectType"
            value={project.projectType}
            onValueChange={(value) => setProject(prev => ({...prev, projectType: value}))}
          >
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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
      </div>

      {/* Image Upload Section */}
      <div className="space-y-2 mt-6">
        <Label className="text-sm font-medium">Representative Image</Label>
        <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600 hover:border-primary/50 transition-colors duration-200">
          <Input 
            type="file"
            name="representativeImage"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            className="cursor-pointer"
          />
          {project.representativeImage && (
            <div className="mt-4 relative group">
              <Image 
                src={project.representativeImage} 
                alt="Project Preview"
                width={200}
                height={200}
                className="rounded-lg object-cover shadow-md transition-transform duration-200 group-hover:scale-105"
              />
            </div>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full mt-8 py-6 text-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        {initialProject ? 'Update Project' : 'Create Project'}
      </Button>
    </form>
  );
}
