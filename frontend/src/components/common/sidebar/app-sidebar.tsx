"use client";

import * as React from "react";
import {
    AudioWaveform,
    BookOpen,
    Bot,
    CalendarRange,
    Command,
    Frame,
    GalleryVerticalEnd,
    LayoutDashboard,
    Map,
    PieChart, School,
    Settings2,
    SquareTerminal,
    Users,
} from "lucide-react";

import {NavMain} from "@/components/common/sidebar/nav-main";
import {NavProjects} from "@/components/common/sidebar/nav-projects";
import {NavUser} from "@/components/common/sidebar/nav-user";
import {TeamSwitcher} from "@/components/common/sidebar/team-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
    teams: [
        {
            name: "DORSU Scheduler",
            logo: "/dorsu-icon.png",
            plan: "Admin",
        },
    ],
    navMain: [
        {
            title: "Dashboard",
            url: "#",
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: "Faculty",
            url: "#",
            icon: Users,
            items: [
                {
                    title: "All Faculties",
                    url: "/faculty",
                },
                {
                    title: "Departments",
                    url: "/departments",
                },
                {
                    title: "Courses",
                    url: "/courses",
                },
            ],
        },
        {
            title: "Schedules",
            url: "/schedules",
            icon: CalendarRange,
        },
        {
            title: "Classrooms",
            url: "/classrooms",
            icon: School,
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ],
    projects: [
        {
            name: "Design Engineering",
            url: "#",
            icon: Frame,
        },
        {
            name: "Sales & Marketing",
            url: "#",
            icon: PieChart,
        },
        {
            name: "Travel",
            url: "#",
            icon: Map,
        },
    ],
};

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" variant="floating" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams}/>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain}/>
                <NavProjects projects={data.projects}/>
            </SidebarContent>
            <SidebarFooter>
                <NavUser/>
            </SidebarFooter>
        </Sidebar>
    );
}
