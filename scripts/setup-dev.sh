#!/bin/bash
# Setup script for urgdstudios.com development environment
# Installs Git pre-commit hook for security scanning

set -euo pipefail

echo "🔧 Setting up urgdstudios.com development environment..."
echo ""

# Install pre-commit hook
echo "Installing pre-commit security scanning hook..."
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "✅ Pre-commit hook installed"
echo ""

# Verify security tools are installed
echo "Checking security tools..."
MISSING_TOOLS=()

if ! command -v cfn-lint &> /dev/null; then
    MISSING_TOOLS+=("cfn-lint")
fi

if ! command -v checkov &> /dev/null; then
    MISSING_TOOLS+=("checkov")
fi

if ! command -v semgrep &> /dev/null; then
    MISSING_TOOLS+=("semgrep")
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo "⚠️  Missing security tools: ${MISSING_TOOLS[*]}"
    echo ""
    echo "Install with:"
    echo "  pip install --upgrade cfn-lint checkov semgrep"
    echo ""
    exit 1
fi

echo "✅ All security tools installed"
echo ""
echo "========================================"
echo "✅ Development environment ready"
echo "========================================"
echo ""
echo "Pre-commit hook will run security scans before each commit:"
echo "  - cfn-lint (CloudFormation validation)"
echo "  - Checkov (infrastructure security)"
echo "  - Semgrep (code security)"
echo ""
