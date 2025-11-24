"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CalendarLegend() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500 border-2 border-green-600" />
                        <span>Published</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-500 border-2 border-yellow-600" />
                        <span>Draft</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-500 border-2 border-gray-600" />
                        <span>Archived</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
