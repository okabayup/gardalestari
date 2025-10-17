

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { MemberWithStatus } from '@/app/actions/user';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';

export function ManageTeamDialog({ isOpen, onClose, allMembers, currentTeamIds, onSave }: {
    isOpen: boolean;
    onClose: () => void;
    allMembers: MemberWithStatus[];
    currentTeamIds: string[];
    onSave: (newTeamIds: string[]) => Promise<void>;
}) {
    const [selectedIds, setSelectedIds] = useState(currentTeamIds);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSelectedIds(currentTeamIds);
    }, [currentTeamIds, isOpen]);

    const handleSave = async () => {
        setLoading(true);
        await onSave(selectedIds);
        setLoading(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kelola Tim Proyek</DialogTitle>
                    <DialogDescription>Pilih anggota yang akan terlibat dalam proyek ini.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-72 my-4">
                    <div className="p-4 space-y-2">
                        {allMembers.map(member => (
                            <div key={member.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                                <Checkbox
                                    id={`member-${member.id}`}
                                    checked={selectedIds.includes(member.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedIds(prev => checked ? [...prev, member.id] : prev.filter(id => id !== member.id))
                                    }}
                                />
                                <Label htmlFor={`member-${member.id}`} className="flex items-center gap-2 flex-1 cursor-pointer">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.avatarUrl}/>
                                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{member.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.position}</p>
                                    </div>
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Simpan Tim
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
