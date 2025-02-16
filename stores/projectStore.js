import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useProjectStore = create(
  persist(
    (set) => ({
      project: {
        _id: null
      },
      addProject: (projectData) => set({ project: projectData }),
      updateProject: (updatedData) => set((state) => ({ project: { ...state.project, ...updatedData } })),
      deleteProject: () => set({ project: { _id: null, name: '', createdAt: null, updatedAt: null } })
    }),
    {
      name: 'project',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useProjectStore;
