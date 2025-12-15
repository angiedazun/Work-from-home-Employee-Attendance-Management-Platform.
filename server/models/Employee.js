const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required']
  },
  workSchedule: {
    checkInTime: {
      type: String,
      default: '08:00'
    },
    checkOutTime: {
      type: String,
      default: '17:00'
    },
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5] // Monday to Friday
    }
  },
  faceData: {
    descriptors: {
      type: Array,
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    isRegistered: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date
    }
  },
  salary: {
    type: Number,
    min: 0
  },
  address: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  isActive: {
    type: Boolean,
    default: true
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

// Update timestamp on save
employeeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
