import 'dart:async';

import 'package:flutter/material.dart';

import '../api/api_service.dart';
import 'login_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  // ==========================================================
  // CONTROLLERS
  // ==========================================================

  final nameController = TextEditingController();
  final studentIdController = TextEditingController();
  final emailController = TextEditingController();
  final otpController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  // Admin course management controllers
  final adminCourseController = TextEditingController();
  bool isAdminAddingCourse = false;

  // ==========================================================
  // EMAIL VERIFICATION STATE
  // ==========================================================

  bool isEmailVerified = false;
  String? verifiedEmail;
  bool isSendingOtp = false;
  bool isWaitingVerification = false;
  bool isCheckingStatusManual = false;
  bool isVerifyingOtp = false;

  Timer? emailPollingTimer;
  int resendSeconds = 0;
  Timer? resendTimer;

  // ==========================================================
  // DROPDOWNS
  // ==========================================================

  int? selectedYearLevel;
  String? selectedBlock;
  String? selectedCourse;

  List<String> courses = [];
  bool isLoadingCourses = true;
  String? courseError;
  String? adminCourseError;

  final List<Map<String, dynamic>> yearLevels = [];

  final List<String> blocks = [
    'Block 1',
    'Block 2',
    'Block 3',
    'Block 4',
    'Block 5',
  ];

  // ==========================================================
  // PASSWORD VISIBILITY
  // ==========================================================

  bool hidePassword = true;
  bool hideConfirmPassword = true;
  bool isLoading = false;

  // ==========================================================
  // INIT & DISPOSE
  // ==========================================================

  @override
  void initState() {
    super.initState();
    emailController.addListener(_onEmailChanged);
    _loadSchoolStructure();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    setState(() {
      isLoadingCourses = true;
      courseError = null;
    });
    try {
      final fetched = await ApiService.getCourses();
      if (!mounted) return;
      setState(() {
        courses = fetched;
        isLoadingCourses = false;
        courseError = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isLoadingCourses = false;
        courseError = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _loadSchoolStructure() async {
    setState(() {
      isLoadingCourses = true;
      courseError = null;
    });
    try {
      final structure = await ApiService.getSchoolStructure();
      if (!mounted) return;
      setState(() {
        // Map backend year level values to UI labels
        final yearMap = <int, String>{}
        if (structure['yearLevels'] is List) {
          for (int i = 0; i < structure['yearLevels'].length; i++) {
            final value = structure['yearLevels'][i];
            yearMap[i + 1] = _yearLevelLabel(value);
          }
        }
        yearLevels = yearMap.entries.map((e) => {'value': e.key, 'label': e.value}).toList().cast<Map<String, dynamic>>();
        
        // Map backend block values to UI labels
        final blockMap = <String, String>{}
        if (structure['blocks'] is List) {
          for (int i = 0; i < structure['blocks'].length; i++) {
            final value = structure['blocks'][i];
            blockMap['${i + 1}'] = 'Block ${i + 1}';
          }
        }
        blocks = blockMap.entries.map((e) => e.value).toList();
        
        // Courses already fetched separately
        isLoadingCourses = false;
        courseError = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isLoadingCourses = false;
        courseError = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  // ==========================================================
  // ADMIN COURSE MANAGEMENT
  // ==========================================================

  Future<void> _addCourse() async {
    final courseName = adminCourseController.text.trim();
    if (courseName.isEmpty) {
      setState(() {
        adminCourseError = 'Please enter a course name';
      });
      return;
    }

    setState(() {
      isAdminAddingCourse = true;
      adminCourseError = null;
    });

    try {
      final result = await ApiService.addCourse(courseName: courseName);
      if (!mounted) return;
      setState(() {
        courses = List.from(courses)..add(courseName);
        isAdminAddingCourse = false;
        adminCourseController.clear();
        adminCourseError = null;
      });
      showMessage('Course "$courseName" added successfully!', success: true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isAdminAddingCourse = false;
        adminCourseError = e.toString().replaceFirst('Exception: ', '');
      };
      showMessage(adminCourseError!,);
  }
  }

  void _showCourseManagementDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Manage Courses'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Currently enrolled courses
              if (courses.isNotEmpty)...[
                const Text('Current Courses:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: courses.map((courseName) {
                    return FilterChip(
                      label: Text(courseName),
                      selected: true,
                      onSelected: (bool) {},
                      backgroundColor: const Color(0xFFE4E6E7),
                      side: const BorderSide(color: Color(0xFF64748B)),
                    );
                  }).toList(),
                ),
              ],

              const SizedBox(height: 16),
              // Add new course
              TextField(
                controller: adminCourseController,
                decoration: InputDecoration(
                  hintText: 'Add new course name',
                  filled: true,
                  fillColor: const Color(0xFFF1F5F9),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(9),
                    borderSide: const BorderSide(color: Color(0xFFD8DEE8)),
                  ),
                ),
              ),

              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      final courseName = adminCourseController.text.trim();
                      if (courseName.isNotEmpty) {
                        _addCourse();
                        Navigator.of(context).pop();
                      }
                    },
                    child: const Text('Add Course'),
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // EMAIL VERIFICATION STATE
  // ==========================================================

  Future<void> sendAndVerifyEmailOtp() async {
    final email = emailController.text.trim().toLowerCase();

    if (email.isEmpty) {
      showMessage('Please enter your email address first.');
      return;
    }

    if (!email.contains('@') || !email.contains('.')) {
      showMessage('Please enter a valid email address.');
      return;
    }

    if (isSendingOtp) return;
    setState(() {
      isSendingOtp = true;
    });

    try {
      final emailExists = await ApiService.checkEmailExists(email: email);
      if (emailExists) {
        if (!mounted) return;
        setState(() {
          isSendingOtp = false;
        });
        showMessage(
          'This email address is already registered. Please log in or use a different email.',
        );
        return;
      }

      await ApiService.sendRegisterOtp(email: email);
      if (!mounted) return;
      setState(() {
        isSendingOtp = false;
        isWaitingVerification = true;
        verifiedEmail = email;
      });
      startResendTimer();
      startVerificationPolling(email);
      showMessage(
        'Account Verification email sent to $email. Please check your inbox and click the Verify button.',
        success: true,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isSendingOtp = false;
      });
      showMessage(
        e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> verifyRegisterOtpCode() async {
    final email = emailController.text.trim().toLowerCase();
    final otp = otpController.text.trim();

    if (email.isEmpty) {
      showMessage('Please enter your email address first.');
      return;
    }

    if (otp.length != 6) {
      showMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (isVerifyingOtp) return;
    setState(() {
      isVerifyingOtp = true;
    });

    try {
      await ApiService.verifyRegisterOtp(
        email: email,
        otp: otp,
      );
      if (!mounted) return;
      stopVerificationPolling();
      setState(() {
        isVerifyingOtp = false;
        isWaitingVerification = false;
        isEmailVerified = true;
        verifiedEmail = email;
        resendSeconds = 0;
      });
      showMessage('Email address verified successfully!', success: true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isVerifyingOtp = false;
      });
      showMessage(
        e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  void startResendTimer() {
    resendTimer?.cancel();
    setState(() {
      resendSeconds = 60;
    });

    resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (resendSeconds <= 1) {
        timer.cancel();
        setState(() {
          resendSeconds = 0;
        });
      } else {
        setState(() {
          resendSeconds--;
        });
      }
    });
  }

  void startVerificationPolling(String email) {
    emailPollingTimer?.cancel();
    emailPollingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      checkEmailStatus(email: email, silent: true);
    });
  }

  void stopVerificationPolling() {
    emailPollingTimer?.cancel();
    resendTimer?.cancel();
  }

  Future<void> checkEmailStatus({required String email, bool silent = false}) async {
    if (isCheckingStatusManual && silent) return;

    if (!silent) {
      setState(() {
        isCheckingStatusManual = true;
      });
    }

    try {
      final isVerified = await ApiService.checkEmailVerificationStatus(
        email: email,
      );
      if (!mounted) return;
      if (!silent) {
        setState(() {
          isCheckingStatusManual = false;
        });
      }
      if (isVerified) {
        stopVerificationPolling();
        setState(() {
          isWaitingVerification = false;
          isEmailVerified = true;
          verifiedEmail = email;
          resendSeconds = 0;
        });
        showMessage('Email address verified successfully!', success: true);
      } else if (!silent) {
        showMessage(
          'Email is not verified yet. Please click the verification link sent to your email.',
        );
      }
    } catch (e) {
      if (!mounted) return;
      if (!silent) {
        setState(() {
          isCheckingStatusManual = false;
        });
        showMessage(e.toString().replaceFirst('Exception: ', ''));
      }
    }
  }

  // ==========================================================
  // REGISTER
  // ==========================================================

  Future<void> registerUser() async {
    FocusScope.of(context).unfocus();

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (nameController.text.trim().isEmpty) {
      showMessage('Please enter the full name.');
      return;
    }

    if (studentIdController.text.trim().isEmpty) {
      showMessage('Please enter the student ID.');
      return;
    }

    if (selectedCourse == null) {
      showMessage('Please select a course.');
      return;
    }

    if (selectedYearLevel == null) {
      showMessage('Please select a year level.');
      return;
    }

    if (selectedBlock == null) {
      showMessage('Please select a block.');
      return;
    }

    final email = emailController.text.trim().toLowerCase();
    if (email.isEmpty) {
      showMessage('Please enter the email address.');
      return;
    }

    if (!email.contains('@') || !email.contains('.')) {
      showMessage('Please enter a valid email address.');
      return;
    }

    final emailExists = await ApiService.checkEmailExists(email: email);
    if (emailExists) {
      showMessage('This email address is already registered. Please log in or use a different email.');
      return;
    }

    if (!isEmailVerified || email != verifiedEmail) {
      showMessage('Please verify your email address before registering.');
      if (!isWaitingVerification) {
        sendAndVerifyEmailOtp();
      }
      return;
    }

    if (passwordController.text.isEmpty) {
      showMessage('Please enter a password.');
      return;
    }

    if (passwordController.text.length < 6) {
      showMessage('Password must be at least 6 characters.');
      return;
    }

    if (confirmPasswordController.text.isEmpty) {
      showMessage('Please confirm your password.');
      return;
    }

    if (passwordController.text != confirmPasswordController.text) {
      showMessage('Passwords do not match.');
      return;
    }

    // --------------------------------------------------------
    // START LOADING
    // --------------------------------------------------------

    setState(() {
      isLoading = true;
    });

    try {
      // ----------------------------------------------------
      // SEND TO LARAVEL API
      // ----------------------------------------------------

      await ApiService.register(
        name: nameController.text.trim(),
        studentId: studentIdController.text.trim(),
        course: selectedCourse!,
        yearLevel: selectedYearLevel!.toString(),
        section: selectedBlock!,
        email: email,
        password: passwordController.text,
        passwordConfirmation: confirmPasswordController.text,
      );
      if (!mounted) return;
      setState(() {
        isLoading = false;
      });

      // ----------------------------------------------------
      // SUCCESS
      // ----------------------------------------------------

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Student account created successfully.'),
          backgroundColor: Colors.green,
        ),
      );

      // ----------------------------------------------------
      // GO BACK TO LOGIN
      // ----------------------------------------------------

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const LoginPage(),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isLoading = false;
      });
      showMessage(
        e.toString().replaceFirst(
          'Exception: ',
          '',
        ),
      );
    }
  }

  // ==========================================================
  // MESSAGE
  // ==========================================================

  void showMessage(String message, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: success ? Colors.green : Colors.red,
      ),
    );
  }

  // ==========================================================
  // BUILD
  // ==========================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF8D94A3),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final bool compact = constraints.maxWidth < 600;
            return Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(
                  horizontal: compact ? 16 : 28,
                  vertical: compact ? 18 : 30,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxWidth: 500,
                  ),
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(
                            alpha: 0.14,
                          ),
                          blurRadius: 28,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // ==================================================
                        // HEADER
                        // ==================================================

                        Container(
                          width: double.infinity,
                          padding: EdgeInsets.fromLTRB(
                            compact ? 22 : 28,
                            compact ? 22 : 26,
                            compact ? 22 : 28,
                            compact ? 20 : 24,
                          ),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.vertical(
                              top: Radius.circular(22),
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(width: 14),
                              // HEADER TEXT
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: const [
                                    Text(
                                      'Register Account',
                                      style: TextStyle(
                                        fontSize: 23,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF1F2937),
                                      ),
                                    ),
                                    SizedBox(height: 5),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        // ==================================================
                        // DIVIDER
                        // ==================================================

                        const Divider(
                          height: 1,
                          thickness: 1,
                          color: Color(0xFFE8EDF2),
                        ),

                        // ==================================================
                        // FORM
                        // ==================================================

                        Padding(
                          padding: EdgeInsets.fromLTRB(
                            compact ? 22 : 28,
                            compact ? 22 : 26,
                            compact ? 22 : 28,
                            compact ? 24 : 28,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // ==================================================
                              // STUDENT INFORMATION
                              // ==================================================

                              const SizedBox(height: 16),

                              // FULL NAME
                              fieldLabel(
                                'Full Name',
                                required: true,
                              ),

                              const SizedBox(height: 7),
                              buildTextField(
                                controller: nameController,
                                hint: 'e.g. Juan Dela Cruz',
                                textCapitalization: TextCapitalization.words,
                              ),

                              const SizedBox(height: 16),

                              // STUDENT ID
                              fieldLabel(
                                'Student ID',
                                required: true,
                              ),

                              const SizedBox(height: 7),
                              buildTextField(
                                controller: studentIdController,
                                hint: 'e.g. 2026-001',
                              ),

                              const SizedBox(height: 16),

                              // COURSE
                              fieldLabel(
                                'Course',
                                required: true,
                              ),

                              const SizedBox(height: 7),
                              buildCourseDropdown(),

                              const SizedBox(height: 16),

                              // YEAR LEVEL + BLOCK
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        fieldLabel(
                                          'Year Level',
                                          required: true,
                                        ),
                                        const SizedBox(
                                          height: 7,
                                        ),
                                        buildYearDropdown(),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(
                                    width: 12,
                                  ),

                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        fieldLabel(
                                          'Block',
                                          required: true,
                                        ),
                                        const SizedBox(
                                          height: 7,
                                        ),
                                        buildBlockDropdown(),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 26),

                              // ==================================================
                              // COURSE MANAGEMENT (Add/Edit/Remove)
                              // ==================================================
                              if (isSaddingCourse || adminCourseError != null) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF0F7FF),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.well(
                                      color: const Color(0xFFBAE6FD),
                                    ),

                              // ==================================================
                              // Course management
                              // ==================================================
                              // Course dropdown and manage button
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Course selector
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        fieldLabel(
                                          'Course',
                                          required: true,
                                        ),
                                        const SizedBox(
                                          height: 7,
                                        ),
                                        buildCourseDropdown(),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(
                                    width: 12,
                                  ),

                                  // Manage courses button
                                  if (!isLoadingCourses)
                                    ElevatedButton(
                                      onPressed: () {
                                        _showCourseManagementDialog();
                                      },
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 8,
                                        ),
                                        minimumSize: const Size(0, 24),
                                      ),
                                      child: const Text(
                                        Manage,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Course adding interface
                              if (isAdminAddingCourse) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Expanded(
                                      child: TextField(
                                        controller: adminCourseController,
                                        decoration: InputDecoration(
                                          hintText: Course
                                            height: 14,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Color(0xFF273654),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          const Expanded(
                                            child: Text(
                                              'Adding course...',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                color: Color(0xFF1E40AF),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ]

                              // ==================================================
                              // ACCOUNT INFORMATION
                              // ==================================================

                              const SizedBox(height: 16),

                              // EMAIL
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  fieldLabel(
                                    'Email Address',
                                    required: true,
                                  ),

                                  if (isEmailVerified)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDCFCE7),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: const Color(0xFF86EFAC),
                                        ),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.check_circle,
                                            size: 13,
                                            color: Color(0xFF16A34A),
                                          ),
                                          SizedBox(width: 4),
                                          Text(
                                            'Verified',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF15803D),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),

                              const SizedBox(height: 7),
                              buildTextField(
                                controller: emailController,
                                hint: 'e.g. juan@school.edu',
                                keyboardType: TextInputType.emailAddress,
                                enabledBorderColor: isEmailVerified
                                    ? const Color(0xFF22C55E)
                                    : null,
                                suffixIcon: isEmailVerified
                                    ? const Icon(
                                        Icons.check_circle,
                                        color: Color(0xFF22C55E),
                                        size: 20,
                                      )
                                    : TextButton(
                                        onPressed: isSendingOtp
                                            ? null
                                            : sendAndVerifyEmailOtp,
                                        style: TextButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 10,
                                          ),
                                          minimumSize: Size.zero,
                                          tapTargetSize: MaterialTapTargetSize
                                              .shrinkWrap,
                                        ),
                                        child: isSendingOtp
                                            ? const SizedBox(
                                                width: 14,
                                                height: 14,
                                                child: CircularProgressIndicator(
                                                  strokeWidth: 2,
                                                  color: Color(0xFF273654),
                                                ),
                                              )
                                            : const Text(
                                                'Verify',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w700,
                                                  color: Color(0xFF273654),
                                                ),
                                              ),
                                      ),
                              ),

                              if (isWaitingVerification) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF0F7FF),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.well(
                                      color: const Color(0xFFBAE6FD),
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const SizedBox(
                                            width: 14,
                                            height: 14,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Color(0xFF273654),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          const Expanded(
                                            child: Text(
                                              'Account Verification email sent. Waiting for email verification...',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                color: Color(0xFF1E40AF),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          if (resendSeconds > 0)
                                            Text(
                                              'Resend in ${resendSeconds}s',
                                              style: const TextStyle(
                                                fontSize: 11.5,
                                                color: Color(0xFF64748B),
                                              ),
                                            )
                                          else
                                            GestureDetector(
                                              onTap: isSendingOtp
                                                  ? null
                                                  : sendAndVerifyEmailOtp,
                                              child: const Text(
                                                'Resend Email',
                                                style: TextStyle(
                                                  fontSize: 11.5,
                                                  fontWeight: FontWeight.bold,
                                                  color: Color(0xFF273654),
                                                ),
                                              ),
                                            ),
                                          GestureDetector(
                                            onTap: isCheckingStatusManual
                                                ? null
                                                : () {
                                                    final email = emailController
                                                        .text
                                                        .trim();
                                                    if (email.isNotEmpty) {
                                                      checkEmailStatus(
                                                        email: email,
                                                        silent: false,
                                                    );
                                                    }
                                                  },
                                            child: isCheckingStatusManual
                                                ? const SizedBox(
                                                    width: 12,
                                                    height: 12,
                                                    child: CircularProgressIndicator(
                                                      strokeWidth: 1.5,
                                                      color: Color(0xFF273654),
                                                    ),
                                                  )
                                                : const Text(
                                                    'Check Status',
                                                    style: TextStyle(
                                                      fontSize: 11.5,
                                                      fontWeight: FontWeight.bold,
                                                      color: Color(0xFF273654),
                                                    ),
                                                  ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],

                              const SizedBox(height: 16),

                              // PASSWORD
                              fieldLabel(
                                'Password',
                                required: true,
                              ),

                              const SizedBox(height: 7),
                              buildPasswordField(
                                controller: passwordController,
                                hint: 'At least 6 characters',
                                hidePassword: hidePassword,
                                onToggle: () {
                                  setState(() {
                                    hidePassword = !hidePassword;
                                  });
                                },
                              ),

                              const SizedBox(height: 16),

                              // CONFIRM PASSWORD
                              fieldLabel(
                                'Confirm Password',
                                required: true,
                              ),

                              const SizedBox(height: 7),
                              buildPasswordField(
                                controller: confirmPasswordController,
                                hint: 'Re-enter the password',
                                hidePassword: hideConfirmPassword,
                                onToggle: () {
                                  setState(() {
                                    hideConfirmPassword = !hideConfirmPassword;
                                  });
                                },
                              ),

                              const SizedBox(height: 28),

                              // ==================================================
                              // BUTTONS
                              // ==================================================

                              Row(
                                children: [
                                  // CANCEL
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: isLoading
                                          ? null
                                          : () {
                                              Navigator.pop(
                                                context,
                                              );
                                            },
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: const Color(
                                          0xFF334155,
                                        ),
                                        side: const BorderSide(
                                          color: Color(0xFFD1D5DB),
                                        ),
                                        minimumSize: const Size(
                                          0,
                                          48,
                                        ),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                      ),
                                      child: const Text(
                                        'Cancel',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ),

                                  const SizedBox(
                                    width: 12,
                                  ),

                                  // REGISTER
                                  Expanded(
                                    flex: 2,
                                    child: ElevatedButton(
                                      onPressed: isLoading
                                          ? null
                                          : registerUser,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(
                                          0xFF273654,
                                        ),
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        minimumSize: const Size(
                                          0,
                                          48,
                                        ),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                      ),
                                      child: isLoading
                                          ? const SizedBox(
                                              width: 19,
                                              height: 19,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: Colors.white,
                                              ),
                                            )
                                          : const Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                Icon(
                                                  Icons.person_add_alt_1,
                                                  size: 18,
                                                ),
                                                SizedBox(
                                                  width: 7,
                                                ),
                                                Text(
                                                  'Register',
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  Widget sectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            color: const Color(0xFF273654),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 9),
        Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1F2937),
          ),
        ),
      ],
    );
  }

  // ==========================================================
  // FIELD LABEL
  // ==========================================================

  Widget fieldLabel(
    String label, {
    bool required = false,
  }) {
    return RichText(
      text: TextSpan(
        text: label,
        style: const TextStyle(
          fontSize: 12.5,
          fontWeight: FontWeight.w600,
          color: Color(0xFF374151),
          height: 1.2,
        ),
        children: required
            ? const [
                TextSpan(
                  text: ' *',
                  style: TextStyle(
                    color: Color(0xFF374151),
                  ),
                ),
              ]
            : null,
      ),
    );
  }

  // ==========================================================
  // TEXT FIELD
  // ==========================================================

  Widget buildTextField({
    required TextEditingController controller,
    required String hint,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    Widget? suffixIcon,
    Color? enabledBorderColor,
  }) {
    return SizedBox(
      height: 47,
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        textCapitalization: textCapitalization,
        style: const TextStyle(
          fontSize: 13,
          color: Color(0xFF334155),
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(
            fontSize: 12,
            color: Color(0xFF94A3B8),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 12,
          ),
          filled: true,
          fillColor: const Color(0xFFF1F5F9),
          suffixIcon: suffixIcon,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(9),
            borderSide: BorderSide(
              color: enabledBorderColor ?? const Color(0xFFD8DEE8),
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(9),
            borderSide: BorderSide(
              color: enabledBorderColor ?? const Color(0xFFD8DEE8),
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(9),
            borderSide: BorderSide(
              color: enabledBorderColor ?? const Color(0xFF273654),
              width: 1.3,
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // PASSWORD FIELD
  // ==========================================================

  Widget buildPasswordField({
    required TextEditingController controller,
    required String hint,
    required bool hidePassword,
    required VoidCallback onToggle,
  }) {
    return SizedBox(
      height: 47,
      child: TextField(
        controller: controller,
        obscureText: hidePassword,
        style: const TextStyle(
          fontSize: 13,
          color: Color(0xFF334155),
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(
            fontSize: 12,
            color: Color(0xFF94A3B8),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 12,
          ),
          filled: true,
          fillColor: const Color(0xFFF1F5F9),
          suffixIcon: IconButton(
            onPressed: onToggle,
            padding: EdgeInsets.zero,
            icon: Icon(
              hidePassword
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              size: 20,
              color: const Color(0xFF94A3B8),
            ),
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(9),
            borderSide: const BorderSide(
              color: Color(0xFFD8DEE8),
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(9),
            borderSide: const BorderSide(
              color: Color(0xFFD8DEE8),
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(9),
            borderSide: const BorderSide(
              color: Color(0xFF273654),
              width: 1.3,
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // YEAR LEVEL DROPDOWN
  // ==========================================================

  Widget buildYearDropdown() {
    return SizedBox(
      height: 47,
      child: DropdownButtonFormField<int>(
        initialValue: selectedYearLevel,
        isExpanded: true,
        icon: const Icon(
          Icons.keyboard_arrow_down,
          size: 20,
        ),
        hint: const Text(
          'Select Year Level',
          style: TextStyle(
            fontSize: 12,
            color: Color(0xFF64748B),
          ),
        ),
        style: const TextStyle(
          fontSize: 12.5,
          color: Color(0xFF334155),
        ),
        decoration: dropdownDecoration(),
        items: yearLevels.map((year) {
          return DropdownMenuItem<int>(
            value: year['value'] as int,
            child: Text(
              year['label'] as String,
            ),
          );
        }).toList(),
        onChanged: isLoadingCourses
            ? null
            : (value) {
                setState(() {
                  selectedYearLevel = value;
                });
              },
      ),
    );
  }

  // ==========================================================
  // BLOCK DROPDOWN
  // ==========================================================

  Widget buildBlockDropdown() {
    return SizedBox(
      height: 47,
      child: DropdownButtonFormField<String>(
        initialValue: selectedBlock,
        isExpanded: true,
        icon: const Icon(
          Icons.keyboard_arrow_down,
          size: 20,
        ),
        hint: const Text(
          'Select Block',
          style: TextStyle(
            fontSize: 12,
            color: Color(0xFF64748B),
          ),
        ),
        style: const TextStyle(
          fontSize: 12.5,
          color: Color(0xFF334155),
        ),
        decoration: dropdownDecoration(),
        items: blocks.map((block) {
          return DropdownMenuItem<String>(
            value: block,
            child: Text(block),
          );
        }).toList(),
        onChanged: isLoadingCourses
            ? null
            : (value) {
                setState(() {
                  selectedBlock = value;
                });
              },
      ),
    );
  }

  // ==========================================================
  // COURSE DROPDOWN
  // ==========================================================

  Widget buildCourseDropdown() {
    if (isLoadingCourses) {
      return Container(
        height: 47,
        padding: const EdgeInsets.symmetric(horizontal: 13),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(9),
          border: Border.all(color: const Color(0xFFD8DEE8)),
        ),
        child: Row(
          children: [
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF273654)),
            ),
            const SizedBox(width: 10),
            Text(
              'Loading courses...',
              style: TextStyle(fontSize: 12.5, color: const Color(0xFF64748B)),
            ),
          ],
        ),
      );
    }

    if (courseError != null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(9),
          border: Border.well(color: const Color(0xFFFCA5A5)),
        ),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Failed to load courses.',
                style: const TextStyle(fontSize: 12, color: Colors.red),
              ),
            ),
            TextButton(
              onPressed: _loadCourses,
              child: const Text('Retry', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    }

    // Include both API-fetched courses and admin-added courses
    final allCourses = List<String>.from(courses)..addAll(
      adminCourseController.text.isNotEmpty
          ? [adminCourseController.text]
          : [],
    ).toSet().toList();

    return SizedBox(
      height: 47,
      child: DropdownButtonFormField<String>(
        initialValue: selectedCourse,
        isExpanded: true,
        icon: const Icon(
          Icons.keyboard_arrow_down,
          size: 20,
        ),
        hint: const Text(
          'Select Course',
          style: TextStyle(
            fontSize: 12,
            color: Color(0xFF64748B),
          ),
        ),
        style: const TextStyle(
          fontSize: 12.5,
          color: Color(0xFF334155),
        ),
        decoration: dropdownDecoration(),
        items: allCourses.map((course) {
          return DropdownMenuItem<String>(
            value: course,
            child: Text(course),
          );
        }).toList(),
        onChanged: isLoadingCourses
            ? null
            : (value) {
                setState(() {
                  selectedCourse = value;
                });
              },
      ),
    );
  }

  // ==========================================================
  // DROPDOWN DECORATION
  // ==========================================================

  InputDecoration dropdownDecoration() {
    return InputDecoration(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 13,
        vertical: 11,
      ),
      filled: true,
      fillColor: const Color(0xFFF1F5F9),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9),
        borderSide: const BorderSide(
          color: Color(0xFFD8DEE8),
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9),
        borderSide: const BorderSide(
          color: Color(0xFFD8DEE8),
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9),
        borderSide: const BorderSide(
          color: Color(0xFF273654),
          width: 1.3,
        ),
      ),
    );
  }

  String _yearLevelLabel(dynamic value) {
    if (value is int) {
      return 'Year ${value}';
    }
    if (value is String) {
      if (value.startsWith('Year') || value.startsWith('year')) {
        return value;
      }
      // Try to extract number from strings like '1', '2', etc.
      final num = int.tryParse(value);
      if (num != null) {
        return 'Year $num';
      }
    }
    return value.toString();
  }
}