import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentQuery } from "@/features/students/hooks";
import { useStudentAttendanceSummaryQuery } from "@/features/attendance/hooks";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudentQuery(id);
  const { data: attendance, isLoading: attendanceLoading } = useStudentAttendanceSummaryQuery(id);

  return (
    <AppShell title="Student Profile">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {isLoading ? (
          <Skeleton className="h-72 w-full max-w-2xl" />
        ) : !student ? (
          <p className="text-sm text-muted-foreground">Student not found.</p>
        ) : (
          <Card className="max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{student.fullName}</CardTitle>
                <Badge variant={student.isArchived ? "outline" : "success"}>
                  {student.isArchived ? "Archived" : "Active"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Program</p>
                <p className="font-medium text-foreground">{student.class.batch.program}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Batch</p>
                <p className="font-medium text-foreground">{student.class.batch.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Class</p>
                <p className="font-medium text-foreground">{student.class.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Group</p>
                <p className="font-medium text-foreground">{student.group?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sex</p>
                <p className="font-medium text-foreground">
                  {student.sex === "MALE" ? "Male" : "Female"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium text-foreground">{student.category}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && student && (
          <Card className="max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Attendance</CardTitle>
                {attendance?.dropWarning && (
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Drop warning
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : !attendance || attendance.total === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
              ) : (
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Present</p>
                    <p className="font-medium text-foreground">{attendance.presentCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Late</p>
                    <p className="font-medium text-foreground">{attendance.lateCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Absent</p>
                    <p className="font-medium text-foreground">{attendance.absentCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Percentage</p>
                    <p className="font-medium text-foreground">{attendance.percentage}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          Grades and demerit history will appear here in a later phase.
        </p>
      </div>
    </AppShell>
  );
}
