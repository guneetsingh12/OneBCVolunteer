import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, UserCheck, UserX, Loader2, Mail, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RoleApprovals = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Get all pending requests from user_roles
            const { data, error } = await supabase
                .from('user_roles')
                .select(`
                    id,
                    user_id,
                    role,
                    status,
                    created_at
                `)
                .eq('status', 'pending');

            if (error) throw error;

            if (data && data.length > 0) {
                // Fetch emails from auth.users (requires a helper or we join with volunteers)
                // Since we can't join auth directly easily with anon key, we look into volunteers table
                const { data: volunteers } = await supabase
                    .from('volunteers')
                    .select('id, email, first_name, last_name');

                const merged = data.map(req => {
                    const vol = volunteers?.find(v => v.id === req.user_id);
                    return {
                        ...req,
                        email: vol?.email || 'No Email Found',
                        name: vol ? `${vol.first_name || ''} ${vol.last_name || ''}`.trim() : 'Unknown User',
                        role: req.role || 'volunteer'
                    };
                });
                setRequests(merged);
            } else {
                setRequests([]);
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: "Failed to fetch requests: " + err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        setActionLoading(requestId);
        try {
            const { error } = await supabase
                .from('user_roles')
                .update({ status: 'approved' })
                .eq('id', requestId);

            if (error) throw error;

            toast({
                title: "Approved",
                description: "User role has been activated.",
            });
            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (err: any) {
            toast({
                title: "Error",
                description: "Action failed: " + err.message,
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setActionLoading(requestId);
        try {
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .eq('id', requestId);

            if (error) throw error;

            toast({
                title: "Rejected",
                description: "Request has been removed.",
            });
            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (err: any) {
            toast({
                title: "Error",
                description: "Action failed: " + err.message,
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading pending requests...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Role Approvals</h1>
            </div>

            {requests.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <UserCheck className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-xl font-medium text-muted-foreground">All caught up!</p>
                        <p className="text-sm text-muted-foreground">No pending role requests found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <Card key={request.id} className="overflow-hidden border-l-4 border-l-amber-500">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            {request.name}
                                            <Badge variant="outline" className="capitalize">
                                                {request.role.replace('_', ' ')}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <Mail className="h-3 w-3" />
                                            {request.email}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => handleReject(request.id)}
                                            disabled={!!actionLoading}
                                        >
                                            <UserX className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-success hover:bg-success/90 text-white"
                                            onClick={() => handleApprove(request.id)}
                                            disabled={!!actionLoading}
                                        >
                                            {actionLoading === request.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <BadgeCheck className="h-4 w-4 mr-1" />
                                            )}
                                            Approve Access
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">
                                    Requested on: {new Date(request.created_at).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoleApprovals;
