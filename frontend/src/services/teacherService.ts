/**
 * Teacher Service
 * API service for all teacher-related operations
 */

import axios, { AxiosInstance } from 'axios';
import {
  DashboardData,
  ClassDetails,
  StudentDetails,
  Assessment,
  ClassAnalytics,
  ClassReport,
  UpdateLearningPathRequest,
  CreateInterventionRequest,
  UpdateInterventionRequest,
  AssignMaterialRequest,
  CreateFeedbackRequest,
  LearningPath,
  Intervention,
  MaterialAssignment,
  TeacherFeedback
} from '../types/teacher.types';

class TeacherService {
  private api: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3000/api') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add token interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await axios.post(`${baseURL}/auth/refresh`, {
              refreshToken
            });
            
            const { accessToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Dashboard & Overview
   */
  async getDashboard(): Promise<DashboardData> {
    const response = await this.api.get('/teacher/dashboard');
    return response.data.data;
  }

  /**
   * Class Management
   */
  async getClasses(): Promise<ClassDetails[]> {
    const response = await this.api.get('/teacher/classes');
    return response.data.data;
  }

  async getClassDetails(classId: number): Promise<ClassDetails> {
    const response = await this.api.get(`/teacher/classes/${classId}`);
    return response.data.data;
  }

  async getClassAnalytics(classId: number, period: number = 30): Promise<ClassAnalytics> {
    const response = await this.api.get(`/teacher/classes/${classId}/analytics`, {
      params: { period }
    });
    return response.data.data;
  }

  async exportClassReport(classId: number, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<ClassReport> {
    const response = await this.api.get(`/teacher/classes/${classId}/report`, {
      params: { format }
    });
    return response.data.data;
  }

  /**
   * Student Management
   */
  async getStudentDetails(studentId: number): Promise<StudentDetails> {
    const response = await this.api.get(`/teacher/students/${studentId}`);
    return response.data.data;
  }

  /**
   * Assessment Management
   */
  async getAssessmentDetails(assessmentId: number): Promise<Assessment> {
    const response = await this.api.get(`/teacher/assessments/${assessmentId}`);
    return response.data.data;
  }

  /**
   * Learning Path Management
   */
  async updateLearningPath(pathId: number, updates: UpdateLearningPathRequest): Promise<LearningPath> {
    const response = await this.api.patch(`/teacher/learning-paths/${pathId}`, updates);
    return response.data.data;
  }

  /**
   * Intervention Management
   */
  async scheduleIntervention(data: CreateInterventionRequest): Promise<Intervention> {
    const response = await this.api.post('/teacher/interventions', data);
    return response.data.data;
  }

  async updateIntervention(interventionId: number, updates: UpdateInterventionRequest): Promise<Intervention> {
    const response = await this.api.patch(`/teacher/interventions/${interventionId}`, updates);
    return response.data.data;
  }

  /**
   * Material Assignment
   */
  async assignMaterial(data: AssignMaterialRequest): Promise<MaterialAssignment> {
    const response = await this.api.post('/teacher/materials/assign', data);
    return response.data.data;
  }

  /**
   * Feedback & Communication
   */
  async addFeedback(data: CreateFeedbackRequest): Promise<TeacherFeedback> {
    const response = await this.api.post('/teacher/feedback', data);
    return response.data.data;
  }
}

export const teacherService = new TeacherService();
export default teacherService;
