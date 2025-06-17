# Contributing to CleanC

First off, thank you for considering contributing to CleanC! It's people like you that make CleanC such a great tool for beginners.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please make sure the bug hasn't already been reported by searching through the [existing issues](https://github.com/junhe421/CleanC/issues).

When creating a bug report, please include:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include system information** (Windows version, CleanC version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as [GitHub issues](https://github.com/junhe421/CleanC/issues). When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Code Contributions

#### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/CleanC.git
   cd CleanC
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Guidelines

- **Follow the existing code style**
- **Write clear, descriptive commit messages**
- **Include tests for new functionality**
- **Update documentation as needed**
- **Keep changes focused and atomic**

#### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for constructors and classes
- Add comments for complex logic

#### Testing

Run the test suite to ensure your changes don't break existing functionality:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:main         # Main process tests
npm run test:renderer     # Renderer process tests
npm run test:e2e          # End-to-end tests
```

#### Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update the README.md with details of changes to the interface (if applicable)
3. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent
4. Create a Pull Request with a clear title and description

### Documentation Contributions

Improvements to documentation are always welcome! This includes:

- Fixing typos or grammatical errors
- Improving clarity of existing documentation
- Adding examples or tutorials
- Translating documentation to other languages

## Development Process

### Project Structure

```
CleanC/
├── src/                    # Source code
│   ├── js/                # JavaScript modules
│   └── css/               # Stylesheets
├── assets/                # Application assets
├── tests/                 # Test suites
├── docs/                  # Documentation
├── main.js               # Electron main process
├── index.html            # Main application window
└── package.json          # Project configuration
```

### Building and Testing

```bash
# Development mode
npm start

# Build for production
npm run build

# Create installer
npm run build:installer

# Run tests
npm test
```

## Code of Conduct

This project and everyone participating in it is governed by the CleanC Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Questions?

If you have questions about contributing, feel free to:

- Open an issue with the `question` label
- Contact us via email: junhe421@gmail.com
- Join our QQ Group: 960598442

Thank you for contributing to CleanC! 🎉 