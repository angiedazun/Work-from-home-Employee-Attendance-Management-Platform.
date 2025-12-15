const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Department = require('./models/Department');

async function fixEmployee() {
  try {
    await mongoose.connect('mongodb://localhost:27017/oa_system');
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'anjanadasun@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ Found user:', user.email, 'ID:', user._id);

    // Check if Employee already exists for this user
    const existingEmp = await Employee.findOne({ userId: user._id });
    if (existingEmp) {
      console.log('✅ Employee record already exists:', existingEmp.employeeId);
      await mongoose.disconnect();
      return;
    }

    // Find existing employee with ID 69
    const emp69 = await Employee.findOne({ employeeId: '69' });
    if (emp69) {
      console.log('Found existing Employee 69, updating userId to:', user._id);
      emp69.userId = user._id;
      await emp69.save();
      console.log('✅ Updated Employee 69 to link with new user');
      await mongoose.disconnect();
      return;
    }

    // Find Operations department
    const dept = await Department.findOne({ name: 'Operations' });
    if (!dept) {
      console.log('❌ Operations department not found');
      process.exit(1);
    }

    console.log('✅ Found department:', dept.name);

    // Create Employee record
    const employee = await Employee.create({
      userId: user._id,
      employeeId: '69',
      department: dept._id,
      position: 'bh',
      joiningDate: new Date(),
      salary: 0,
      address: '',
      emergencyContact: {
        name: '',
        relation: '',
        phone: ''
      }
    });

    console.log('\n✅ Employee record created successfully!');
    console.log('Employee ID:', employee.employeeId);
    console.log('Position:', employee.position);

    await mongoose.disconnect();
    console.log('\n✅ Fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEmployee();
