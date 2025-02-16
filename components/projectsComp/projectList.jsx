'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner";
import { Search, Plus } from 'lucide-react';
import ProjectCard from './projectCard';
import ProjectForm from './ProjectForm';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isArchive, setIsArchive] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllProjects');
      if (response.success) {
        setProjects(response.projects);
      } else {
        toast.error('Failed to fetch projects');
      }
    } catch (error) {
      toast.error('Error fetching projects: ' + error.message);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllStaff');
      if (response.success) {
        setTeamMembers(response.staff);
      }
    } catch (error) {
      toast.error('Failed to fetch team members');
      console.error('Failed to fetch team members', error)
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await window.electronAPI.mainOperation('createProject', projectData);
      
      if (response.success) {
        fetchProjects();
        setIsCreateDialogOpen(false);
        toast.success('Project created successfully');
      } else {
        toast.error(response.error || 'Failed to create project');
      }
    } catch (error) {
      toast.error('Error creating project: ' + error.message);
    }
  };

  const handleUpdateProject = async (projectData) => {
    try {
      const response = await window.electronAPI.mainOperation('updateProject', projectData);
      
      if (response.success) {
        fetchProjects();
        setIsEditDialogOpen(false);
        setSelectedProject(null);
        toast.success('Project updated successfully');
      } else {
        toast.error(response.error || 'Failed to update project');
      }
    } catch (error) {
      toast.error('Error updating project: ' + error.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const response = await window.electronAPI.mainOperation('archiveProject', projectId);
      
      if (response.success) {
        fetchProjects();
        toast.success('Project archived successfully');
      } else {
        toast.error(response.error || 'Failed to archive project');
      }
    } catch (error) {
      toast.error('Error archiving project: ' + error.message);
    }
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>Manage and view all your projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px]">
              <SheetHeader>
                <SheetTitle>Create New Project</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                <ProjectForm 
                  onSubmit={handleCreateProject} 
                  teamMembers={teamMembers}
                />
              </ScrollArea>
              
            </SheetContent>
          </Sheet>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No projects found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project._id}
                project={project}
                onEdit={() => {
                  setSelectedProject(project);
                  setIsEditDialogOpen(true);
                }}
                onDelete={() => {
                  setSelectedProject(project);
                  setIsArchive(true)
                }}
              />
            ))}
          </div>
        )}
      </CardContent>

      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent side="right" className="w-full px-4 sm:max-w-[540px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold">Edit Project</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] pr-4">
            {selectedProject && (
              <ProjectForm initialProject={selectedProject} onSubmit={handleUpdateProject} teamMembers={teamMembers} />
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog 
        open={isArchive} 
        onOpenChange={setIsArchive}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the project {selectedProject?.name}. 
              This action can be reversed by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                handleDeleteProject(selectedProject._id);
                setSelectedProject(null);
                setIsArchive(false)
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Archive Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
