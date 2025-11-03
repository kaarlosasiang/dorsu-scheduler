import { SubjectAPI, SubjectCreateData, SubjectUpdateData } from "@/lib/services/SubjectAPI";

export function useSubjectForm() {
  const createSubject = async (data: SubjectCreateData) => {
    try {
      const response = await SubjectAPI.create(data);
      return response;
    } catch (error) {
      console.error("Error creating subject:", error);
      throw error;
    }
  };

  const updateSubject = async (id: string, data: SubjectUpdateData) => {
    try {
      const response = await SubjectAPI.update(id, data);
      return response;
    } catch (error) {
      console.error("Error updating subject:", error);
      throw error;
    }
  };

  return {
    createSubject,
    updateSubject,
  };
}

