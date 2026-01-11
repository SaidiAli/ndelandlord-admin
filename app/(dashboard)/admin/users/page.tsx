'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, User } from 'lucide-react';
// import { usersApi } from '@/lib/api'; 
import { User as UserType } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function ManageUsersPage() {
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => ({
            data: [],
            message: 'No users found',
        }),
    });

    const users: UserType[] = usersData?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                    <p className="text-gray-600">Administer all users in the system</p>
                </div>
                <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all registered users.</CardDescription>
                </CardHeader>
                <CardContent>
                    {usersLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <User className="h-12 w-12 mx-auto text-gray-400" />
                            <p className="mt-4 font-semibold">No users found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <div key={user.id} className="grid grid-cols-4 items-center py-4">
                                    <div className="col-span-2 space-y-1">
                                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                    <div className="text-sm">
                                        <Badge className={user.role === 'admin' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/80' : ''}>{user.role}</Badge>
                                    </div>
                                    <div className="flex items-center justify-end space-x-2">
                                        <Badge className={user.isActive ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Button>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}