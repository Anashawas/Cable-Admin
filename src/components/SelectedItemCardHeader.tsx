import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { alpha } from '@mui/system';

import CardHeader from '@mui/material/CardHeader';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

import RippleBadge from './RippleBadge';

interface SelectedItemCardHeaderProps {
    title?: string;
    titleColor?: string;
    subtitle?: string;
    subtitleColor?: string;
    iconColor: string;
    iconBackgroundColor?: string;
    badgeVisible?: boolean;
    badgeColor?: string;
    Icon?: any;
    ActionIcon?: any;
    actionLoading?: boolean;
    onActionClick?: (() => void) | null;
}

const SelectedItemCardHeader = ({
    title = '',
    titleColor = 'text.primary',
    subtitle = '',
    subtitleColor = 'text.secondary',
    iconColor,
    iconBackgroundColor = alpha(iconColor, 0.1),
    badgeVisible = false,
    badgeColor = iconColor,
    Icon = QuestionMarkIcon,
    ActionIcon = TravelExploreIcon,
    actionLoading = false,
    onActionClick = null
}: SelectedItemCardHeaderProps) => {

    const { t } = useTranslation();

    return (
        <CardHeader
            avatar={<RippleBadge
                color={badgeColor}
                invisible={!badgeVisible}>
                <Avatar
                    sx={{
                        color: iconColor,
                        background: iconBackgroundColor
                    }}>
                    <Icon />
                </Avatar>
            </RippleBadge>}
            title={title}
            subheader={subtitle}
            titleTypographyProps={{
                sx: {
                    color: titleColor,
                    fontWeight: 'bold',
                    fontSize: 16,
                    wordBreak: 'break-word'
                }
            }}
            subheaderTypographyProps={{
                sx: {
                    color: subtitleColor,
                    wordBreak: 'break-word'
                }
            }}
            action={actionLoading ?
                <Fade in style={{ transitionDelay: '700ms' }} unmountOnExit>
                    <IconButton disabled>
                        <CircularProgress size={24} />
                    </IconButton>
                </Fade>
                :
                onActionClick && <Tooltip title={t('map@zoomIn')} placement='left' arrow>
                    <IconButton
                        onClick={onActionClick}>
                        <ActionIcon />
                    </IconButton>
                </Tooltip>}
        />
    )
}

export default memo(SelectedItemCardHeader);