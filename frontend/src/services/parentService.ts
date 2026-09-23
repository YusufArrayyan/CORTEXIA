/**
 * Parent Service
 * API service for all parent-related operations
 */

import axios, { AxiosInstance } from 'axios';
import {
  ParentDashboardData,
  ChildDetails,
  AssessmentInsights,
  ChildProgress,
  HomePracticeRecommendations,
  TeacherFeedback,
  MilestonesData,
  Intervention
} from '../types/parent.types';

class ParentService {
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
  async getDashboard(): Promise<ParentDashboardData> {
    const response = await this.api.get('/parent/dashboard');
    return response.data.data;
  }

  /**
   * Child Management & Monitoring
   */
  async getChildDetails(childId: number): Promise<ChildDetails> {
    const response = await this.api.get(`/parent/children/${childId}`);
    return response.data.data;
  }

  async getChildProgress(childId: number, period: number = 90): Promise<ChildProgress> {
    const response = await this.api.get(`/parent/children/${childId}/progress`, {
      params: { period }
    });
    return response.data.data;
  }

  /**
   * Assessment Insights
   */
  async getAssessmentInsights(childId: number, assessmentId: number): Promise<AssessmentInsights> {
    const response = await this.api.get(`/parent/children/${childId}/assessments/${assessmentId}`);
    return response.data.data;
  }

  /**
   * Home Practice & Recommendations
   */
  async getHomePractice(childId: number): Promise<HomePracticeRecommendations> {
    const response = await this.api.get(`/parent/children/${childId}/home-practice`);
    return response.data.data;
  }

  /**
   * Teacher Communication
   */
  async getTeacherFeedback(childId: number): Promise<TeacherFeedback[]> {
    const response = await this.api.get(`/parent/children/${childId}/feedback`);
    return response.data.data;
  }

  /**
   * Interventions & Support
   */
  async getUpcomingInterventions(childId: number): Promise<Intervention[]> {
    const response = await this.api.get(`/parent/children/${childId}/interventions`);
    return response.data.data;
  }

  /**
   * Milestones & Achievements
   */
  async getChildMilestones(childId: number): Promise<MilestonesData> {
    const response = await this.api.get(`/parent/children/${childId}/milestones`);
    return response.data.data;
  }
}

export const parentService = new ParentService();
export default parentService;
