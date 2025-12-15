const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Department = require('./models/Department');

async function checkEmployee() {
  try {
    await mongoose.connect('mongodb://localhost:27017/oa_system');
    console.log('Connected to MongoDB');

    // Find the employee by ID 69
    const employee = await Employee.findOne({ employeeId: '69' })
      .populate('userId')
      .populate('department');

    if (employee) {
      console.log('\n✅ Employee Found:');
      console.log('Employee ID:', employee.employeeId);
      console.log('Position:', employee.position);
      console.log('Department:', employee.department?.name || 'N/A');
      
      if (employee.userId) {
        console.log('\n✅ User Account:');
        console.log('Email:', employee.userId.email);
        console.log('Full Name:', employee.userId.fullName);
        console.log('Phone:', employee.userId.phone);
        console.log('Role:', employee.userId.role);
        console.log('Status:', employee.userId.status);
        
        console.log('\n🔐 Login Credentials:');
        console.log('Email:', employee.userId.email);
        console.log('Password: Employee@123');
      } else {
        console.log('\n❌ No user account found for this employee');
      }
    } else {
      console.log('\n❌ Employee with ID 69 not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEmployee();
