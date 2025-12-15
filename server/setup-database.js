const mongoose = require('mongoose');
const path = require('path');

// Load models
const User = require('./models/User');

const uri = 'mongodb://localhost:27017/oa_system';

async function createDatabase() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Drop existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).drop();
      console.log(`🗑️  Dropped collection: ${collection.name}`);
    }

    // 1. USERS COLLECTION - Create using Mongoose model so password hashing hook runs
    const adminUser = new User({
      email: 'admin@oasystem.com',
      password: 'Admin@123', // This will be hashed by the pre-save hook
      role: 'admin',
      fullName: 'System Administrator',
      phone: '1234567890',
      status: 'active'
    });
    await adminUser.save();
    console.log('✅ Users collection created');

    const db = mongoose.connection.db;

    // 2. EMPLOYEES COLLECTION
    await db.createCollection('employees');
    await db.collection('employees').createIndex({ userId: 1 }, { unique: true });
    await db.collection('employees').createIndex({ employeeId: 1 }, { unique: true });
    await db.collection('employees').createIndex({ department: 1 });
    await db.collection('employees').createIndex({ isActive: 1 });
    console.log('✅ Employees collection created');

    // 3. DEPARTMENTS COLLECTION
    await db.createCollection('departments');
    await db.collection('departments').createIndex({ code: 1 }, { unique: true });
    await db.collection('departments').createIndex({ name: 1 });

    await db.collection('departments').insertMany([
      { name: 'Information Technology', code: 'IT', description: 'IT and Software Development', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Human Resources', code: 'HR', description: 'Human Resources Management', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Finance', code: 'FIN', description: 'Finance and Accounting', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Marketing', code: 'MKT', description: 'Marketing and Sales', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Operations', code: 'OPS', description: 'Operations Management', isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ]);
    console.log('✅ Departments collection created with 5 departments');

    // 4. ATTENDANCE COLLECTION
    await db.createCollection('attendance');
    await db.collection('attendance').createIndex({ employeeId: 1, date: 1 }, { unique: true });
    await db.collection('attendance').createIndex({ date: 1 });
    await db.collection('attendance').createIndex({ status: 1 });
    console.log('✅ Attendance collection created');

    // 5. TASKS COLLECTION
    await db.createCollection('tasks');
    await db.collection('tasks').createIndex({ assignedTo: 1 });
    await db.collection('tasks').createIndex({ status: 1 });
    await db.collection('tasks').createIndex({ priority: 1 });
    await db.collection('tasks').createIndex({ dueDate: 1 });
    console.log('✅ Tasks collection created');

    // 6. LEAVES COLLECTION
    await db.createCollection('leaves');
    await db.collection('leaves').createIndex({ employeeId: 1 });
    await db.collection('leaves').createIndex({ status: 1 });
    await db.collection('leaves').createIndex({ startDate: 1 });
    console.log('✅ Leaves collection created');

    // 7. NOTIFICATIONS COLLECTION
    await db.createCollection('notifications');
    await db.collection('notifications').createIndex({ userId: 1 });
    await db.collection('notifications').createIndex({ isRead: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });
    console.log('✅ Notifications collection created');

    // 8. HOLIDAYS COLLECTION
    await db.createCollection('holidays');
    await db.collection('holidays').createIndex({ date: 1 });
    await db.collection('holidays').createIndex({ year: 1 });

    await db.collection('holidays').insertMany([
      { name: 'New Year Day', date: new Date('2025-01-01'), type: 'public', description: 'New Year celebration', isActive: true, year: 2025, createdAt: new Date() },
      { name: 'Republic Day', date: new Date('2025-01-26'), type: 'public', description: 'Republic Day', isActive: true, year: 2025, createdAt: new Date() },
      { name: 'Independence Day', date: new Date('2025-08-15'), type: 'public', description: 'Independence Day', isActive: true, year: 2025, createdAt: new Date() },
      { name: 'Gandhi Jayanti', date: new Date('2025-10-02'), type: 'public', description: 'Gandhi Jayanti', isActive: true, year: 2025, createdAt: new Date() },
      { name: 'Christmas', date: new Date('2025-12-25'), type: 'public', description: 'Christmas', isActive: true, year: 2025, createdAt: new Date() }
    ]);
    console.log('✅ Holidays collection created with 5 holidays');

    // 9. SETTINGS COLLECTION
    await db.createCollection('settings');
    await db.collection('settings').createIndex({ key: 1 }, { unique: true });
    await db.collection('settings').createIndex({ category: 1 });

    await db.collection('settings').insertMany([
      { key: 'work_start_time', value: '08:00', category: 'attendance', description: 'Work start time', createdAt: new Date(), updatedAt: new Date() },
      { key: 'work_end_time', value: '17:00', category: 'attendance', description: 'Work end time', createdAt: new Date(), updatedAt: new Date() },
      { key: 'late_threshold_minutes', value: 15, category: 'attendance', description: 'Late threshold', createdAt: new Date(), updatedAt: new Date() },
      { key: 'face_match_threshold', value: 0.6, category: 'face_recognition', description: 'Face match threshold', createdAt: new Date(), updatedAt: new Date() },
      { key: 'working_days', value: [1, 2, 3, 4, 5], category: 'attendance', description: 'Working days', createdAt: new Date(), updatedAt: new Date() },
      { key: 'company_name', value: 'OA System', category: 'general', description: 'Company name', createdAt: new Date(), updatedAt: new Date() },
      { key: 'enable_face_recognition', value: true, category: 'face_recognition', description: 'Enable face recognition', createdAt: new Date(), updatedAt: new Date() },
      { key: 'max_break_minutes', value: 60, category: 'attendance', description: 'Max break time', createdAt: new Date(), updatedAt: new Date() }
    ]);
    console.log('✅ Settings collection created with 8 settings');

    // 10. AUDIT LOGS COLLECTION
    await db.createCollection('auditlogs');
    await db.collection('auditlogs').createIndex({ userId: 1 });
    await db.collection('auditlogs').createIndex({ timestamp: -1 });
    console.log('✅ Audit logs collection created');

    // Summary
    console.log('\n========================================');
    console.log('✅ DATABASE SETUP COMPLETED!');
    console.log('========================================');
    console.log(`Database: ${dbName}`);
    console.log(`Collections: ${(await db.listCollections().toArray()).length}`);
    console.log('\n📊 Documents Created:');
    console.log(`- users: ${await db.collection('users').countDocuments()}`);
    console.log(`- departments: ${await db.collection('departments').countDocuments()}`);
    console.log(`- holidays: ${await db.collection('holidays').countDocuments()}`);
    console.log(`- settings: ${await db.collection('settings').countDocuments()}`);
    console.log('\n🔐 Admin Login:');
    console.log('Email: admin@oasystem.com');
    console.log('Password: Admin@123');
    console.log('\n⏰ Work Schedule:');
    console.log('Check-in: 8:00 AM');
    console.log('Check-out: 5:00 PM');
    console.log('Working Days: Monday to Friday');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error creating database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createDatabase();
