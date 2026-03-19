"use client";

import * as React from "react";
import {
    CalendarRange,
    LayoutDashboard,
    School,
    Settings2,
    Users,
} from "lucide-react";

import {NavMain} from "@/components/common/sidebar/nav-main";
import {NavUser} from "@/components/common/sidebar/nav-user";
import {TeamSwitcher} from "@/components/common/sidebar/team-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/authContext";

const adminNav = [
    {
        title: "Dashboard",
        url: "/dashboard",
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
                title: "Programs",
                url: "/courses",
            },
            {
                title: "Subjects",
                url: "/subjects",
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
];

const facultyNav = [
    {
        title: "My Schedule",
        url: "/schedules",
        icon: CalendarRange,
    },
];

const staffNav = adminNav.filter((item) => item.url !== "/dashboard");

const teams = [
    {
        name: "DORSU Scheduler",
        logo: "/dorsu-icon.png",
        plan: "Admin",
    },
];

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    const { user } = useAuth();
    const navItems = user?.role === "admin" ? adminNav : user?.role === "faculty" ? facultyNav : staffNav;

    return (
        <Sidebar collapsible="icon" variant="floating" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={teams}/>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems}/>
            </SidebarContent>
            <SidebarFooter>
                <NavUser/>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
