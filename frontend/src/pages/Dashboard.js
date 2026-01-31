import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import VendorDashboard from './vendor/VendorDashboard';
import CustomerDashboard from './CustomerDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  // Route to role-specific dashboard
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  
  if (user?.role === 'vendor') {
    return <VendorDashboard />;
  }
  
  // Default to customer dashboard
  return <CustomerDashboard />;
};

export default Dashboard;
