import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardStats, Volunteer, Event } from '@/types';

interface Activity {
  id: string;
  volunteer_id: string;
  event_id: string | null;
  activity_type: string;
  hours_spent: number;
  doors_knocked: number;
  calls_made: number;
  notes: string;
  activity_date: string;
  created_at: string;
  volunteer?: {
    first_name: string;
    last_name: string;
  };
}

interface DashboardData {
  stats: DashboardStats;
  recentVolunteers: Volunteer[];
  upcomingEvents: Event[];
  recentActivities: Activity[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    stats: {
      total_volunteers: 0,
      active_volunteers: 0,
      pending_volunteers: 0,
      total_events: 0,
      upcoming_events: 0,
      total_hours: 0,
      total_doors: 0,
      total_calls: 0,
      volunteers_this_month: 0,
      events_this_month: 0,
      signups_this_week: 0,
      engagement_rate: 0,
    },
    recentVolunteers: [],
    upcomingEvents: [],
    recentActivities: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch volunteers count
      const { count: totalVolunteers } = await supabase
        .from('volunteers')
        .select('*', { count: 'exact', head: true });

      const { count: activeVolunteers } = await supabase
        .from('volunteers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: pendingVolunteers } = await supabase
        .from('volunteers')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.pending,status.eq.new');

      // Fetch recent volunteers
      const { data: recentVolunteersData } = await supabase
        .from('volunteers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch events count
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      const { count: upcomingEventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'upcoming');

      // Fetch upcoming events
      const { data: upcomingEventsData } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'upcoming')
        .order('start_date', { ascending: true })
        .limit(5);

      // Fetch activities aggregate
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('hours_spent, doors_knocked, calls_made');

      let totalHours = 0;
      let totalDoors = 0;
      let totalCalls = 0;

      if (activitiesData) {
        activitiesData.forEach((a) => {
          totalHours += Number(a.hours_spent) || 0;
          totalDoors += Number(a.doors_knocked) || 0;
          totalCalls += Number(a.calls_made) || 0;
        });
      }

      // Fetch recent activities with volunteer names
      const { data: recentActivitiesData } = await supabase
        .from('activities')
        .select(`
          id,
          volunteer_id,
          event_id,
          activity_type,
          hours_spent,
          doors_knocked,
          calls_made,
          notes,
          activity_date,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get volunteer names for activities
      let activitiesWithNames: Activity[] = [];
      if (recentActivitiesData && recentActivitiesData.length > 0) {
        const volunteerIds = [...new Set(recentActivitiesData.map(a => a.volunteer_id))];
        const { data: volunteersData } = await supabase
          .from('volunteers')
          .select('id, first_name, last_name')
          .in('id', volunteerIds);

        const volunteerMap = new Map(volunteersData?.map(v => [v.id, v]) || []);

        activitiesWithNames = recentActivitiesData.map(activity => ({
          ...activity,
          volunteer: volunteerMap.get(activity.volunteer_id) || { first_name: 'Unknown', last_name: '' }
        }));
      }

      // Calculate this month stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: volunteersThisMonth } = await supabase
        .from('volunteers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      const { count: eventsThisMonth } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Calculate this week signups
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      const { count: signupsThisWeek } = await supabase
        .from('volunteers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString());

      // Calculate engagement rate
      const engagementRate = totalVolunteers && totalVolunteers > 0 
        ? Math.round((activeVolunteers || 0) / totalVolunteers * 100)
        : 0;

      setData({
        stats: {
          total_volunteers: totalVolunteers || 0,
          active_volunteers: activeVolunteers || 0,
          pending_volunteers: pendingVolunteers || 0,
          total_events: totalEvents || 0,
          upcoming_events: upcomingEventsCount || 0,
          total_hours: Math.round(totalHours),
          total_doors: totalDoors,
          total_calls: totalCalls,
          volunteers_this_month: volunteersThisMonth || 0,
          events_this_month: eventsThisMonth || 0,
          signups_this_week: signupsThisWeek || 0,
          engagement_rate: engagementRate,
        },
        recentVolunteers: (recentVolunteersData || []) as Volunteer[],
        upcomingEvents: (upcomingEventsData || []) as Event[],
        recentActivities: activitiesWithNames,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data',
      }));
    }
  };

  return data;
}
