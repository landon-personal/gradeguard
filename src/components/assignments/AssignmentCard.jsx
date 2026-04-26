import { Clock, Calendar, Trash2, Pencil } from "lucide-react";
import { haptic } from "../utils/haptics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays } from "date-fns";
import { parseLocalDate } from "../utils/dateUtils";
import { motion } from "framer-motion";
import AssignmentAttachment from "./AssignmentAttachment";

const difficultyColors = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-red-100 text-red-700 border-red-200"
};

const statusColors = {
  pending: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700"
};

export default function AssignmentCard({ assignment, onEdit, onDelete, onStatusChange, onUpdate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseLocalDate(assignment.due_date);
  const daysUntilDue = differenceInDays(due, today);
  const isOverdue = daysUntilDue < 0 && assignment.status !== 'completed';
  const isUrgent = daysUntilDue >= 0 && daysUntilDue <= 2 && assignment.status !== 'completed';

  const dueDateText = () => {
    if (assignment.status === 'completed') return `Due ${assignment.due_date}`;
    if (isOverdue) return `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`;
    if (daysUntilDue === 0) return 'Due today!';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${daysUntilDue} days`;
  };

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(99,102,241,0.12)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`bg-white rounded-xl shadow-sm p-5 border transition-colors ${
        assignment.status === 'completed' ? 'opacity-60 border-gray-100' :
        isOverdue ? 'border-red-200 bg-red-50/30' :
        isUrgent ? 'border-orange-200 bg-orange-50/20' :
        'border-gray-100'
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 ${assignment.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
            {assignment.name}
          </h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-medium">{assignment.subject}</Badge>
            {assignment.difficulty && (
              <Badge className={`text-xs border ${difficultyColors[assignment.difficulty]}`}>
                {assignment.difficulty}
              </Badge>
            )}
            <Badge className={`text-xs ${statusColors[assignment.status]}`}>
              {assignment.status?.replace('_', ' ')}
            </Badge>

          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <motion.div whileHover={{ scale: 1.2, rotate: 5 }} whileTap={{ scale: 0.85 }}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic.light(); onEdit(assignment); }}>
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.2, rotate: -5 }} whileTap={{ scale: 0.85 }}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic.medium(); onDelete(assignment.id); }}>
              <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className={`flex items-center gap-1 font-medium ${
          isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-gray-500'
        }`}>
          <Calendar className="w-3.5 h-3.5" />
          {dueDateText()}
        </span>
        {assignment.time_estimate && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            ~{assignment.time_estimate} min
          </span>
        )}
      </div>

      <div className="mt-3">
        <Select
          value={assignment.status}
          onValueChange={(value) => onStatusChange(assignment, value)}
        >
          <SelectTrigger className="h-8 text-xs border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {assignment.notes && (
        <p className="text-xs text-gray-400 mt-3 italic leading-relaxed">{assignment.notes}</p>
      )}

      <AssignmentAttachment assignment={assignment} onUpdate={(updates) => onUpdate && onUpdate(assignment.id, updates)} />
    </motion.div>
  );
}