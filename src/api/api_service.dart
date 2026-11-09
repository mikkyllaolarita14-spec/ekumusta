import 'dart:convert';
import 'dart:http';

import 'package:flutter/material.dart';

class ApiService {
  // Same base URL as the React app
  static const String baseUrl = 'http://127.0.0.1:8000/api';

  // GET request helper
  static Future<Map<String, dynamic>> _get(String endpoint) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http.get(
      uri,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load from $endpoint: ${response.statusCode}');
    }
  }

  // POST request helper
  static Future<Map<String, dynamic>> _post(String endpoint, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http.post(
      uri,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: json.encode(data),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to post to $endpoint: ${response.statusCode} - ${response.body}');
    }
  }

  // PATCH request helper
  static Future<Map<String, dynamic>> _patch(String endpoint, Map<String, dynamic> data) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http.patch(
      uri,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: json.encode(data),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to patch $endpoint: ${response.statusCode} - ${response.body}');
    }
  }

  // DELETE request helper
  static Future<Map<String, dynamic>> _delete(String endpoint) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await http.delete(
      uri,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to delete $endpoint: ${response.statusCode}');
    }
  }

  // ==========================================================
  // COURSE METHODS
  // ==========================================================

  /// Fetch all courses from the school structure
  static Future<List<String>> getCourses() async {
    final data = await _get('/admin/school-structure/courses');
    // Return course names array
    if (data['courses'] is List) {
      return List<String>.from(data['courses']);
    }
    return [];
  }

  /// Add a new course to the school structure
  static Future<void> addCourse({required String courseName}) async {
    await _post('/admin/school-structure/courses', {
      'name': courseName,
    });
  }

  /// Update an existing course
  static Future<void> updateCourse({required String id, required String courseName}) async {
    await _patch('/admin/school-structure/courses/$id', {
      'name': courseName,
    });
  }

  /// Delete a course
  static Future<void> deleteCourse({required String id}) async {
    await _delete('/admin/school-structure/courses/$id');
  }

  // ==========================================================
  // SCHOOL STRUCTURE METHODS
  // ==========================================================

  /// Fetch all school structure data (year levels, blocks, courses)
  static Future<Map<String, dynamic>> getSchoolStructure() async {
    final data = await _get('/admin/school-structure');
    return data;
  }

  /// Fetch all courses from the school structure
  static Future<List<String>> getCourses() async {
    final data = await _get('/admin/school-structure/courses');
    // Return course names array
    if (data['courses'] is List) {
      return List<String>.from(data['courses']);
    }
    return [];
  }

  /// Add a new course to the school structure
  static Future<void> addCourse({required String courseName}) async {
    await _post('/admin/school-structure/courses', {
      'name': courseName,
    });
  }

  /// Update an existing course
  static Future<void> updateCourse({required String id, required String courseName}) async {
    await _patch('/admin/school-structure/courses/$id', {
      'name': courseName,
    });
  }

  /// Delete a course
  static Future<void> deleteCourse({required String id}) {
    await _delete('/admin/school-structure/courses/$id');
  }

  // ==========================================================
  // STUDENT REGISTRATION METHODS
  // ==========================================================

  /// Check if email exists
  static Future<bool> checkEmailExists({required String email}) async {
    final data = await _get('/admin/check-email-exists?email=$email');
    return data['exists'] as bool? ?? false;
  }

  /// Send registration OTP
  static Future<void> sendRegisterOtp({required String email}) async {
    await _post('/auth/send-register-otp', {'email': email});
  }

  /// Verify registration OTP
  static Future<void> verifyRegisterOtp({required String email, required String otp}) async {
    await _post('/auth/verify-register-otp', {
      'email': email,
      'otp': otp,
    });
  }

  /// Check email verification status
  static Future<bool> checkEmailVerificationStatus({required String email}) async {
    final data = await _get('/auth/check-email-verification-status?email=$email');
    return data['verified'] as bool? ?? false;
  }

  /// Register student
  static Future<void> register({
    required String name,
    required String studentId,
    required String course,
    required String yearLevel,
    required String section,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    await _post('/auth/register', {
      'name': name,
      'student_id': studentId,
      'course': course,
      'year_level': yearLevel,
      'section': section,
      'email': email,
      'password': password,
      'password_confirmation': passwordConfirmation,
    });
  }
}