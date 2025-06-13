import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, MapPin, Home, Calendar, Eye } from "lucide-react"
import Image from "next/image"
import { useRouter } from 'next/navigation'
import useProjectStore from "@/stores/projectStore"
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import useLoginStore from '@/stores/loginStore';

const STATUS_COLORS = {
  planning: "bg-blue-100 text-blue-700",
  "in-progress": "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  "on-hold": "bg-red-100 text-red-700",
}

export default function ProjectCard({ project, onEdit, onDelete }) {
  const router = useRouter();
  const { addProject } = useProjectStore();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const { user } = useLoginStore();

  const truncateText = (text, maxLength = 50) => {
    if (!text) return ""
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text
  }

  const handleViewProject = () => {
    setIsPasswordDialogOpen(true);
  }

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast.error('Password is required');
      return;
    }

    try {
      const response = await window.electronAPI.login(user.phoneNumber, password);
      if (response.success) {
        addProject(project);
        router.replace("/projects/specific");
      } else {
        toast.error(response.error || 'Invalid password');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <>
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white border border-gray-200 cursor-pointer" onClick={handleViewProject}>
      <div className="relative h-48 overflow-hidden">
        {project.representativeImage ? (
          <Image
            src={project.representativeImage || "/placeholder.svg"}
            alt={`${project.name} preview`}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
            <span className="sr-only">No image available</span>
            <Home className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge className={`absolute top-4 right-4 ${STATUS_COLORS[project.projectStatus] || ""}`}>
          {project.projectStatus?.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-bold mb-2 text-gray-800">{truncateText(project.name, 30)}</h3>
        <p className="text-sm text-gray-600 mb-4">{truncateText(project.description, 100)}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{truncateText(project.location, 20)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Home className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{project.totalUnits || 0} Units</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePasswordSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  )
}
