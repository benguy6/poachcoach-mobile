# Class Management System for Coaches

## Overview

The Class Management System provides coaches with a comprehensive solution for managing active classes, tracking student attendance, and providing feedback. The system includes real-time class monitoring, detailed student information, and a structured feedback process.

## Features

### 1. Active Class Detection
- **Automatic Detection**: The system automatically detects when a class is currently happening based on the current time and session schedule
- **Real-time Updates**: Checks for active classes every 30 seconds
- **Status Tracking**: Tracks class status from 'confirmed' → 'in_progress' → 'completed'

### 2. Small Notification Banner
- **Location**: Appears at the top of the coach's home page when a class is active
- **Information Display**: Shows class name, number of students, and time
- **Quick Actions**: 
  - Click to open detailed class modal
  - "End" button for quick class termination
- **Visual Design**: Green accent border with play icon indicating active status

### 3. Detailed Class Modal
- **Comprehensive Information**: 
  - Class details (sport, date, time, location, price)
  - Student list with profile pictures and payment status
  - Class description and type
- **Student Management**: 
  - View all enrolled students
  - See payment status (paid/unpaid)
  - Access student contact information
- **Class Control**: Large "End Class" button at the bottom

### 4. Feedback System
- **Structured Feedback Form**:
  - General class feedback (required)
  - Topics covered
  - Student progress overview
  - Next session planning
- **Individual Student Feedback** (optional):
  - Star rating system (1-5 stars)
  - Personalized feedback for each student
  - Toggle to show/hide individual feedback section
- **Payment Processing**: Automatically credits coach wallet upon feedback submission

## Database Schema

### New Tables

#### Class_Feedback
```sql
- id (UUID, Primary Key)
- session_unique_id (UUID, Foreign Key to Sessions)
- coach_id (UUID, Foreign Key to Users)
- general_feedback (TEXT, Required)
- topics_covered (TEXT, Optional)
- student_progress (TEXT, Optional)
- next_session_plan (TEXT, Optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Student_Feedback
```sql
- id (UUID, Primary Key)
- session_unique_id (UUID, Foreign Key to Sessions)
- coach_id (UUID, Foreign Key to Users)
- student_id (UUID, Foreign Key to Users)
- feedback (TEXT, Required)
- rating (INTEGER, 1-5, Optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Updated Session Status Flow
1. **confirmed** → Initial state when session is created
2. **in_progress** → When coach starts the class
3. **completed** → When coach ends the class and submits feedback

## API Endpoints

### Backend Routes (`/api/coach/class-management/`)

#### GET `/active-class`
- **Purpose**: Get currently active class for the coach
- **Response**: Active class details with student information
- **Logic**: Finds sessions where current time is between start and end time

#### POST `/start-class`
- **Purpose**: Start a class (change status to 'in_progress')
- **Body**: `{ uniqueId: string }`
- **Response**: Success confirmation with session details

#### POST `/end-class`
- **Purpose**: End a class (change status to 'completed')
- **Body**: `{ uniqueId: string }`
- **Response**: Success confirmation with earnings calculation
- **Side Effects**: 
  - Updates student session status to 'attended'
  - Calculates total earnings

#### POST `/submit-feedback`
- **Purpose**: Submit class and student feedback
- **Body**: 
  ```json
  {
    "uniqueId": "string",
    "generalFeedback": "string",
    "topicsCovered": "string",
    "studentProgress": "string", 
    "nextSessionPlan": "string",
    "studentFeedbacks": [
      {
        "studentId": "string",
        "feedback": "string",
        "rating": number
      }
    ]
  }
  ```
- **Response**: Success confirmation
- **Side Effects**: 
  - Credits coach wallet with session earnings
  - Creates transaction record
  - Stores feedback in database

## Frontend Components

### 1. ActiveClassBanner
- **Location**: `frontend/src/components/ActiveClassBanner.tsx`
- **Purpose**: Small notification banner for active classes
- **Features**: 
  - Real-time class information
  - Quick access to detailed modal
  - End class functionality

### 2. ClassDetailsModal
- **Location**: `frontend/src/components/ClassDetailsModal.tsx`
- **Purpose**: Comprehensive class information display
- **Features**:
  - Full class details
  - Student list with photos and payment status
  - End class confirmation dialog

### 3. ClassFeedbackModal
- **Location**: `frontend/src/components/ClassFeedbackModal.tsx`
- **Purpose**: Structured feedback collection
- **Features**:
  - General feedback form
  - Individual student feedback with ratings
  - Form validation
  - Toggle for individual feedback section

## User Flow

### 1. Class Detection
1. Coach opens app
2. System checks for active classes
3. If active class found, banner appears
4. Banner shows class name and student count

### 2. Starting a Class
1. Coach sees "Start Class" button on upcoming sessions
2. Clicks button to start class
3. Session status changes to 'in_progress'
4. Active class banner appears

### 3. During Class
1. Coach can view detailed class information via banner
2. See all students with payment status
3. Access class details and student information
4. Monitor class progress

### 4. Ending Class
1. Coach clicks "End Class" (from banner or modal)
2. Confirmation dialog appears
3. Class status changes to 'completed'
4. Students marked as 'attended'
5. Earnings calculated and displayed

### 5. Feedback Submission
1. After ending class, feedback modal appears
2. Coach fills out general feedback (required)
3. Optional: Add individual student feedback
4. Submit feedback to complete process
5. Earnings credited to coach wallet

## Setup Instructions

### 1. Database Setup
Run the SQL script in your Supabase SQL Editor:
```sql
-- Execute the contents of backend/setup-feedback-tables.sql
```

### 2. Backend Setup
The new routes are automatically registered in `backend/src/index.js`:
```javascript
app.use('/api/coach/class-management', coachClassManagementRouter);
```

### 3. Frontend Setup
Import and use the new components in your coach pages:
```javascript
import ActiveClassBanner from '../../components/ActiveClassBanner';
import ClassDetailsModal from '../../components/ClassDetailsModal';
import ClassFeedbackModal from '../../components/ClassFeedbackModal';
```

## Security Features

### Row Level Security (RLS)
- **Class_Feedback**: Coaches can only view and insert their own feedback
- **Student_Feedback**: Students can only view feedback about themselves, coaches can insert

### Authentication
- All endpoints require valid authentication token
- Coach ID verification for all operations
- Session ownership validation

### Data Validation
- Required field validation
- Rating range validation (1-5 stars)
- Session status validation

## Error Handling

### Common Error Scenarios
1. **No Active Class**: Returns null when no class is currently happening
2. **Invalid Session**: 404 error for non-existent or unauthorized sessions
3. **Invalid Status**: Prevents operations on sessions with wrong status
4. **Missing Feedback**: Requires general feedback before submission

### User Feedback
- Loading states during API calls
- Success/error alerts for all operations
- Confirmation dialogs for destructive actions
- Form validation with clear error messages

## Future Enhancements

### Potential Features
1. **Real-time Notifications**: Push notifications for class start/end
2. **Attendance Tracking**: Mark individual student attendance
3. **Class Notes**: Rich text editor for detailed class notes
4. **Photo Upload**: Upload class photos or videos
5. **Analytics**: Class performance metrics and trends
6. **Student Feedback**: Allow students to provide feedback on classes

### Technical Improvements
1. **WebSocket Integration**: Real-time updates without polling
2. **Offline Support**: Cache class data for offline viewing
3. **Performance Optimization**: Lazy loading for large student lists
4. **Accessibility**: Screen reader support and keyboard navigation

## Troubleshooting

### Common Issues
1. **Banner Not Appearing**: Check session times and status
2. **Feedback Not Submitting**: Verify all required fields are filled
3. **Wallet Not Updated**: Check transaction logs and wallet balance
4. **Student List Empty**: Verify student enrollment and payment status

### Debug Information
- All API calls include detailed logging
- Error responses include specific error messages
- Database queries are logged for debugging
- Frontend includes console logging for state changes 