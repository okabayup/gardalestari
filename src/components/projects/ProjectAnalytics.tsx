
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProjectColumn, ProjectTask } from "@/app/actions/projects";
import { MemberWithStatus } from "@/app/actions/members";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, CartesianGrid, XAxis, YAxis, Bar, Legend } from "recharts";

interface ProjectAnalyticsProps {
    columns: ProjectColumn[];
    tasks: ProjectTask[];
    members: MemberWithStatus[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function ProjectAnalytics({ columns, tasks, members }: ProjectAnalyticsProps) {

    // --- Data Calculation ---
    const taskDistributionData = columns.map(col => ({
        name: col.title,
        value: col.taskIds.length,
    }));

    const memberWorkload = members.map(member => {
        const assignedTasks = tasks.filter(task => task.assigneeIds?.includes(member.id));
        return {
            name: member.name.split(' ')[0], // Use first name for brevity
            tasks: assignedTasks.length,
        }
    }).filter(d => d.tasks > 0);

    const totalTasks = tasks.length;
    const completedTasks = columns.find(c => c.title === 'Selesai')?.taskIds.length || 0;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;


    // --- Chart Configurations ---
    const taskDistributionConfig = {
        tasks: { label: "Tugas" },
        ...Object.fromEntries(taskDistributionData.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]))
    } satisfies ChartConfig;

     const memberWorkloadConfig = {
        tasks: { label: "Jumlah Tugas", color: "hsl(var(--primary))" },
    } satisfies ChartConfig;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Ringkasan Proyek</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{totalTasks}</p>
                        <p className="text-sm text-muted-foreground">Total Tugas</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{completedTasks}</p>
                        <p className="text-sm text-muted-foreground">Tugas Selesai</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{completionPercentage.toFixed(0)}%</p>
                        <p className="text-sm text-muted-foreground">Tingkat Penyelesaian</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{members.length}</p>
                        <p className="text-sm text-muted-foreground">Anggota Tim</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribusi Tugas per Kolom</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={taskDistributionConfig} className="mx-auto aspect-square h-[250px]">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
                                <Pie data={taskDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {taskDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Beban Kerja Anggota Tim</CardTitle>
                        <CardDescription>Menampilkan jumlah tugas yang ditugaskan ke setiap anggota.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={memberWorkloadConfig} className="h-[250px] w-full">
                            <BarChart data={memberWorkload} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Legend />
                                <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
