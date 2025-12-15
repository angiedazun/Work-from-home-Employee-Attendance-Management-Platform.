const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkInTime: {
    type: Date,
    required: true
  },
  checkInFaceData: {
    imageUrl: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  checkOutTime: {
    type: Date
  },
  checkOutFaceData: {
    imageUrl: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'],
    default: 'present'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateByMinutes: {
    type: Number,
    default: 0
  },
  isEarlyCheckout: {
    type: Boolean,
    default: false
  },
  earlyByMinutes: {
    type: Number,
    default: 0
  },
  breakTime: {
    type: Number,
    default: 0
  },
  overtime: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique attendance per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Update timestamp on save
attendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
