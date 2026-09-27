<?php

declare(strict_types=1);

// Pass 3 intentionally exposes no internal endpoint. Any future internal route mounted
// by this profile inherits titan.maps.internal and therefore fails closed unless the
// host binds InternalRequestAuthorizer to authenticated service-identity verification.
