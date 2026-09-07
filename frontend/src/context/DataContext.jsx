import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState({
    employees: [],
    leaves: [],
    recruitment: [],
    attendance: [],
    evaluations: [],
    contracts: [],
    users: [],
    trainings: [],
    documents: [],
    payrollHistory: [],
    payrollRecords: [],
    applications: [],
    settings: {},
    disciplinaryActions: [],
    advances: [],
    departments: [],
    positions: [],
    leaveBalances: [],
    notifications: [],
    projects: [],
    projectAllocations: []
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sirh-data');
      const incoming = response.data || {};
      setData({
        employees: incoming.employees || [],
        leaves: incoming.leaves || [],
        recruitment: incoming.recruitment || [],
        attendance: incoming.attendance || [],
        evaluations: incoming.evaluations || [],
        contracts: incoming.contracts || [],
        users: incoming.users || [],
        trainings: incoming.trainings || [],
        documents: incoming.documents || [],
        payrollHistory: incoming.payrollHistory || [],
        payrollRecords: incoming.payrollRecords || [],
        applications: incoming.applications || [],
        settings: incoming.settings || {},
        disciplinaryActions: incoming.disciplinaryActions || [],
        advances: incoming.advances || [],
        departments: incoming.departments || [],
        positions: incoming.positions || [],
        leaveBalances: incoming.leaveBalances || [],
        notifications: incoming.notifications || [],
        projects: incoming.projects || [],
        projectAllocations: incoming.projectAllocations || []
      });
    } catch (error) {
      console.error('Error fetching SIRH data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, user]);

  return (
    <DataContext.Provider value={{ data, loading, refreshData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
