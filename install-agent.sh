#!/usr/bin/env bash
#
# Igloo agent installer for Debian/Ubuntu
# - Downloads wrlliam/igloo agent binary
# - Installs to /usr/local/bin/igloo-agent
# - Optionally creates a systemd service (running as root)
# - Optionally opens TCP port 5172 via UFW (installing UFW if missing)
#

set -euo pipefail

#############################
# Colours & Logging Helpers #
#############################

BOLD="\033[1m"
RED="\033[1;31m"
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
BLUE="\033[1;34m"
MAGENTA="\033[1;35m"
CYAN="\033[1;36m"
RESET="\033[0m"

timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

log_info() {
  echo -e "${CYAN}[$(timestamp)] [INFO]${RESET} $*"
}

log_warn() {
  echo -e "${YELLOW}[$(timestamp)] [WARN]${RESET} $*"
}

log_error() {
  echo -e "${RED}[$(timestamp)] [ERROR]${RESET} $*" >&2
}

log_success() {
  echo -e "${GREEN}[$(timestamp)] [ OK ]${RESET} $*"
}

log_step() {
  echo -e "${MAGENTA}[$(timestamp)] [STEP]${RESET} $*"
}

trap 'log_error "Installation failed. Check the logs above for details."' ERR

##################
# Configurable   #
##################

REPO_OWNER="wrlliam"
REPO_NAME="igloo"
BINARY_PATH_IN_REPO="agent/dist/agent"
BRANCH="main"

BINARY_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${BINARY_PATH_IN_REPO}"

INSTALL_DIR="/usr/local/bin"
BINARY_NAME="igloo-agent"
BINARY_DEST="${INSTALL_DIR}/${BINARY_NAME}"

SYSTEMD_UNIT_NAME="igloo-agent.service"
SYSTEMD_UNIT_PATH="/etc/systemd/system/${SYSTEMD_UNIT_NAME}"

LISTEN_PORT="5172"

#########################
# Basic Sanity & Root   #
#########################

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    log_error "This script must be run as root. Try: sudo bash $0"
    exit 1
  fi
}

check_os() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    case "${ID:-}" in
      ubuntu|debian)
        log_info "Detected Debian/Ubuntu-based system (${ID})."
        ;;
      *)
        log_warn "Detected non-Debian/Ubuntu system (${ID:-unknown}). Script is tuned for Debian/Ubuntu, but may still work."
        ;;
    esac
  else
    log_warn "/etc/os-release not found; unable to verify OS. Proceeding cautiously."
  fi
}

##############################
# Utility / Prompt Functions #
##############################

ask_yes_no() {
  local prompt="$1"
  local default="${2:-N}"  # Y or N
  local default_hint

  if [[ "${default}" =~ ^[Yy]$ ]]; then
    default_hint="Y/n"
  else
    default_hint="y/N"
  fi

  while true; do
    echo -ne "${BLUE}$(timestamp) [PROMPT]${RESET} ${prompt} (${default_hint}): "
    read -r reply || reply=""
    reply="${reply:-$default}"

    case "${reply}" in
      [Yy]*)
        return 0
        ;;
      [Nn]*)
        return 1
        ;;
      *)
        log_warn "Please answer 'y' or 'n'."
        ;;
    esac
  done
}

ensure_command() {
  local cmd="$1"
  local pkg="${2:-}"

  if command -v "${cmd}" >/dev/null 2>&1; then
    return 0
  fi

  if [[ -n "${pkg}" ]]; then
    if command -v apt-get >/dev/null 2>&1; then
      log_step "Installing missing dependency '${cmd}' via apt-get (${pkg})..."
      apt-get update -y >/dev/null
      apt-get install -y "${pkg}" >/dev/null
      if command -v "${cmd}" >/dev/null 2>&1; then
        log_success "Installed '${cmd}'."
        return 0
      else
        log_error "Failed to install '${cmd}' (package: ${pkg})."
        return 1
      fi
    else
      log_error "apt-get not available; cannot install '${cmd}'. Install it manually and re-run the script."
      return 1
    fi
  else
    log_error "Required command '${cmd}' not found and no package specified."
    return 1
  fi
}

###############################
# Download & Install Binary   #
###############################

download_agent() {
  log_step "Downloading igloo agent from GitHub..."
  ensure_command curl curl || ensure_command wget wget

  local tmpfile
  tmpfile="$(mktemp /tmp/igloo-agent.XXXXXX)"

  if command -v curl >/dev/null 2>&1; then
    if ! curl -fsSL "${BINARY_URL}" -o "${tmpfile}"; then
      log_error "Failed to download agent binary via curl."
      rm -f "${tmpfile}"
      exit 1
    fi
  else
    if ! wget -qO "${tmpfile}" "${BINARY_URL}"; then
      log_error "Failed to download agent binary via wget."
      rm -f "${tmpfile}"
      exit 1
    fi
  fi

  if [[ ! -s "${tmpfile}" ]]; then
    log_error "Downloaded file is empty or missing. Aborting."
    rm -f "${tmpfile}"
    exit 1
  fi

  log_info "Download successful. Installing to ${BINARY_DEST}..."
  install -m 0755 "${tmpfile}" "${BINARY_DEST}"
  rm -f "${tmpfile}"
  log_success "Installed igloo agent to ${BINARY_DEST}."
}

###################################
# systemd Service Creation/Enable #
###################################

create_systemd_service() {
  log_step "Creating systemd service at ${SYSTEMD_UNIT_PATH}..."

  cat > "${SYSTEMD_UNIT_PATH}" <<EOF
[Unit]
Description=Igloo Agent (wrlliam/igloo)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${BINARY_DEST}
Restart=on-failure
RestartSec=5
User=root
# NOTE: This service runs as root. Only use on trusted, local networks.
#       Do NOT expose this agent to the public internet.

[Install]
WantedBy=multi-user.target
EOF

  log_info "Reloading systemd daemon..."
  systemctl daemon-reload

  log_info "Enabling and starting ${SYSTEMD_UNIT_NAME}..."
  systemctl enable --now "${SYSTEMD_UNIT_NAME}"

  systemctl --no-pager status "${SYSTEMD_UNIT_NAME}" || true

  log_success "systemd service '${SYSTEMD_UNIT_NAME}' created, enabled and started."
}

#####################################
# Firewall (UFW) Port 5172 Handling #
#####################################

configure_firewall() {
  log_step "Preparing to configure firewall for TCP port ${LISTEN_PORT}..."

  if ! ask_yes_no "Open TCP port ${LISTEN_PORT} via UFW (Uncomplicated Firewall)?" "N"; then
    log_warn "Skipping firewall configuration at user request."
    return 0
  fi

  ensure_command ufw ufw || {
    log_error "UFW could not be installed; skipping firewall configuration."
    return 1
  }

  # Warn if enabled on remote systems; user might lock themselves out
  log_warn "If this is a remote server, ensure you have an existing allow rule for your SSH port before enabling or modifying UFW."

  if ! ufw status >/dev/null 2>&1; then
    log_warn "UFW status could not be determined. You may need to configure it manually."
  fi

  local ufw_status
  ufw_status="$(ufw status | head -n1 || true)"

  log_info "Current UFW status: ${ufw_status}"

  log_info "Adding rule: allow ${LISTEN_PORT}/tcp ..."
  ufw allow "${LISTEN_PORT}/tcp" || {
    log_error "Failed to add UFW rule for port ${LISTEN_PORT}."
    return 1
  }

  if [[ "${ufw_status}" == "Status: inactive" ]]; then
    if ask_yes_no "UFW is currently inactive. Enable UFW now?" "N"; then
      log_info "Enabling UFW..."
      ufw enable
      log_success "UFW enabled."
    else
      log_warn "UFW left inactive. The rule is created but not enforced until UFW is enabled."
    fi
  else
    log_success "UFW rule added for port ${LISTEN_PORT}/tcp."
  fi
}

#########################
# Main Execution Flow   #
#########################

main() {
  echo -e "${BOLD}${MAGENTA}
╔══════════════════════════════════════════════╗
║           Igloo Agent Installer              ║
╠══════════════════════════════════════════════╣
║  Repo: ${REPO_OWNER}/${REPO_NAME}                          ║
║  Binary: ${BINARY_PATH_IN_REPO}             ║
║  Port: ${LISTEN_PORT}                                   ║
╚══════════════════════════════════════════════╝
${RESET}"

  echo -e "${YELLOW}Security warning from project README:${RESET}"
  echo -e "${YELLOW}- This project is in early alpha; security is NOT a priority."
  echo -e "- Do NOT expose agents to the internet."
  echo -e "- Only use in trusted, local environments (home lab).${RESET}"
  echo

  require_root
  check_os
  download_agent

  echo
  if ask_yes_no "Create and enable a systemd service to run igloo-agent as root?" "Y"; then
    create_systemd_service
  else
    log_warn "User declined systemd service creation. You can run ${BINARY_DEST} manually."
  fi

  echo
  configure_firewall || log_warn "Firewall configuration encountered issues or was skipped."

  echo
  log_success "All done. Review the above logs and your firewall settings."
  echo -e "${CYAN}To check the service later:${RESET} systemctl status ${SYSTEMD_UNIT_NAME}"
  echo -e "${CYAN}Binary location:${RESET} ${BINARY_DEST}"
}

main "$@"
